/**
 * Next.js API Route Adapter
 * Wraps the healthcheck runner for Next.js API routes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { RunnerConfig } from '../core/types';
import { runHealthCheck } from '../core/runner';
import { validateAuth, createUnauthorizedResponse } from '../core/auth';
import { generateTestPage } from './test-page';

/**
 * Sets security headers on the response
 */
function setSecurityHeaders(res: NextApiResponse, contentType: string = 'application/json'): void {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

/**
 * Determines if the request is for the test page
 */
function isTestPageRequest(req: NextApiRequest, config: RunnerConfig): boolean {
  if (!config.enableTestPage) {
    return false;
  }

  const testPath = typeof config.enableTestPage === 'string' ? config.enableTestPage : 'test';

  // Check catch-all route slug parameter first (Next.js Pages Router)
  const slug = req.query.slug;
  if (Array.isArray(slug) && slug.length > 0) {
    const slugPath = slug.join('/');
    const normalizedTestPath = testPath.replace(/^\/+|\/+$/g, '');
    return slugPath === normalizedTestPath;
  }

  // Fallback: check URL path (for App Router or direct URL matching)
  const urlPath = req.url?.split('?')[0] || '';
  const normalizedTestPath = testPath.replace(/^\/+|\/+$/g, '');
  const normalizedUrlPath = urlPath.replace(/^\/+|\/+$/g, '');

  // Check if URL ends with test path (e.g., /api/healthcheck/test)
  return (
    normalizedUrlPath.endsWith('/' + normalizedTestPath) || normalizedUrlPath === normalizedTestPath
  );
}

/**
 * Gets the healthcheck endpoint URL from the request
 */
function getHealthcheckEndpoint(req: NextApiRequest, config: RunnerConfig): string {
  const testPath = typeof config.enableTestPage === 'string' ? config.enableTestPage : 'test';

  // Get base URL from request
  // For catch-all routes, reconstruct from the original URL
  const urlPath = req.url?.split('?')[0] || '';

  // Normalize test path
  const normalizedTestPath = testPath.replace(/^\/+|\/+$/g, '');

  // Remove test path from URL to get base endpoint
  // e.g., /api/healthcheck/test -> /api/healthcheck
  let baseUrl = urlPath.replace(new RegExp(`/${normalizedTestPath}$`), '').replace(/\/$/, '');

  // If baseUrl is empty or just '/', use default
  if (!baseUrl || baseUrl === '/') {
    baseUrl = '/api/healthcheck';
  }

  return baseUrl;
}

/**
 * Creates a Next.js API route handler for healthcheck
 */
export function createNextHandler(config: RunnerConfig) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow GET requests
    if (req.method !== 'GET') {
      setSecurityHeaders(res);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if this is a test page request
    if (isTestPageRequest(req, config)) {
      const healthcheckEndpoint = getHealthcheckEndpoint(req, config);
      const html = generateTestPage(healthcheckEndpoint);
      setSecurityHeaders(res, 'text/html');
      return res.status(200).send(html);
    }

    // Validate authentication FIRST - before any processing to prevent information leakage
    const authResult = validateAuth(req, config.auth);
    if (!authResult.authorized) {
      const strictMode = config.auth?.strictMode ?? process.env.NODE_ENV === 'production';
      const unauth = createUnauthorizedResponse(strictMode);

      setSecurityHeaders(res);
      return res.status(unauth.status).json(unauth.body);
    }

    try {
      // Run the healthcheck (auth already validated)
      const result = await runHealthCheck(config, req);

      // Set appropriate status code
      const httpStatus = result.status === 'Down' ? 503 : 200;

      // Set security headers
      setSecurityHeaders(res);

      // Return response
      return res.status(httpStatus).json(result);
    } catch (error) {
      // Handle auth errors or other failures
      if ((error as Error)?.message === 'UNAUTHORIZED') {
        const strictMode = config.auth?.strictMode ?? process.env.NODE_ENV === 'production';
        const unauth = createUnauthorizedResponse(strictMode);
        setSecurityHeaders(res);
        return res.status(unauth.status).json(unauth.body);
      }

      // Other errors - return minimal information in production
      const isProduction = process.env.NODE_ENV === 'production';
      setSecurityHeaders(res);

      if (isProduction) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Development mode - show error details
      return res.status(500).json({
        error: 'Internal server error',
        message: (error as Error)?.message || 'Unknown error'
      });
    }
  };
}
