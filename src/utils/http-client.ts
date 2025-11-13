import type { Status, StatusNode } from '../core/types';
import { createStatusNode } from '../core/aggregator';

interface HttpCheckOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  expectedStatus?: number;
}

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async checkEndpoint(
    path: string,
    name: string,
    options: HttpCheckOptions = {}
  ): Promise<StatusNode> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 5000,
      retries = 2,
      expectedStatus = 200
    } = options;

    // Handle absolute URLs vs relative paths
    let url: string;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Absolute URL - use as-is
      url = path;
    } else {
      // Relative path - prepend baseUrl
      const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      url = `${baseUrl}${cleanPath}`;
    }

    const startTime = Date.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method,
          headers: {
            'User-Agent': 'Watchtower-HealthCheck/1.0',
            ...headers
          },
          signal: controller.signal,
          ...(body ? { body: JSON.stringify(body) } : {})
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        const statusCode = response.status;

        // Check if status code matches expectation
        if (statusCode === expectedStatus) {
          return createStatusNode(
            `http_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name,
            'Up',
            `${statusCode} OK (${duration}ms)`,
            undefined,
            {
              statusCode,
              responseTime: duration,
              url,
              attempt: attempt + 1
            }
          );
        } else {
          // Unexpected status code
          return createStatusNode(
            `http_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name,
            'Down',
            `HTTP ${statusCode} (expected ${expectedStatus}) (${duration}ms)`,
            undefined,
            {
              statusCode,
              expectedStatus,
              responseTime: duration,
              url,
              attempt: attempt + 1
            }
          );
        }
      } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const err = error as { name?: string; code?: string; message?: string };

        // If this is the last attempt, return the error
        if (attempt === retries) {
          let message = 'Unknown error';
          let status: Status = 'Down';

          if (err.name === 'AbortError') {
            message = `Timeout after ${timeout}ms`;
          } else if (err.code === 'ECONNREFUSED') {
            message = 'Connection refused';
          } else if (err.code === 'ENOTFOUND') {
            message = 'Host not found';
          } else {
            message = err.message || 'Request failed';
          }

          return createStatusNode(
            `http_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name,
            status,
            `${message} (${duration}ms)`,
            undefined,
            {
              error: err.message,
              url,
              attempts: attempt + 1
            }
          );
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    // Fallback (should not reach here)
    return createStatusNode(
      `http_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name,
      'Unknown',
      'Unexpected error',
      undefined
    );
  }
}

/**
 * Get the correct base URL for the current environment
 * Fixed: Does not fabricate domains, throws clear error if misconfigured
 */
export function getBaseUrl(): string {
  // Priority order for base URL resolution
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.DEPLOY_URL) {
    return process.env.DEPLOY_URL.startsWith('http')
      ? process.env.DEPLOY_URL
      : `https://${process.env.DEPLOY_URL}`;
  }

  if (process.env.DOMAIN) {
    if (process.env.DOMAIN.startsWith('http')) {
      return process.env.DOMAIN;
    }
    return `https://${process.env.DOMAIN}`;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Don't fabricate domains - throw clear error
  throw new Error(
    'No base URL configured. Set NEXT_PUBLIC_SITE_URL, SITE_URL, VERCEL_URL, or DOMAIN environment variable'
  );
}

/**
 * Create an HTTP client with automatic base URL resolution
 */
export function createHttpClient(): HttpClient {
  const baseUrl = getBaseUrl();
  return new HttpClient(baseUrl);
}
