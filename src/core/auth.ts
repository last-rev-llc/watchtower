import type { AuthConfig } from './types';

/**
 * Determines if the current environment is production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validates if a request should be allowed to access the healthcheck
 *
 * Security defaults:
 * - In production: auth is REQUIRED by default
 * - Query parameter tokens are DISABLED by default (use headers instead)
 * - Returns false (deny) if auth is required but not provided
 *
 * Simple token-based authentication:
 * 1. Check for token in Authorization header (Bearer token)
 * 2. Check for token in X-Healthcheck-Token header
 * 3. Optionally check query parameter (if allowQueryToken is enabled)
 * 4. Use constant-time comparison to prevent timing attacks
 */
export function validateAuth(
  req: unknown,
  config?: AuthConfig
): { authorized: boolean; reason?: string } {
  const reqObj = req as {
    headers?: Record<string, string | string[]>;
    query?: Record<string, string>;
  };

  // Determine if auth should be required
  const requireAuth = config?.requireAuth ?? isProduction();

  // If no config and auth is required, deny access
  if (!config) {
    if (requireAuth) {
      return { authorized: false, reason: 'Authentication required but not configured' };
    }
    // Development mode: allow if explicitly not required
    return { authorized: true };
  }

  // Check custom validator first (takes precedence)
  if (config.customValidator) {
    const result = config.customValidator(req);
    if (!result && config.onAuthFailure) {
      config.onAuthFailure(req, 'Custom validator rejected request');
    }
    return { authorized: result, reason: result ? undefined : 'Custom validator rejected request' };
  }

  // Token-based authentication (primary method)
  const expectedToken = config.token;
  if (!expectedToken) {
    if (requireAuth) {
      const reason = 'Authentication token required but not configured';
      if (config.onAuthFailure) {
        config.onAuthFailure(req, reason);
      }
      return { authorized: false, reason };
    }
    // Development mode: allow if explicitly not required
    return { authorized: true };
  }

  // Extract tokens from various sources (prioritize headers over query params)
  const authHeader = (reqObj.headers?.['authorization'] || '').toString();
  const tokenHeader = (reqObj.headers?.['x-healthcheck-token'] || '').toString();
  const queryToken = config.allowQueryToken ? reqObj.query?.token || '' : '';

  let providedToken: string | null = null;

  // Priority 1: Bearer token (most common, works with monitoring tools)
  if (authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7).trim();
  }
  // Priority 2: Custom header
  else if (tokenHeader) {
    providedToken = tokenHeader.trim();
  }
  // Priority 3: Query parameter (if enabled - less secure, can appear in logs)
  else if (queryToken) {
    providedToken = queryToken.trim();
  }
  // Priority 4: Basic auth (for compatibility)
  else if (authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
      const [, password] = credentials.split(':');
      providedToken = password;
    } catch {
      // Invalid Basic auth format
    }
  }

  // Validate token using constant-time comparison (prevents timing attacks)
  if (providedToken && constantTimeCompare(providedToken, expectedToken)) {
    return { authorized: true };
  }

  // Token validation failed
  const reason = providedToken ? 'Invalid authentication token' : 'Authentication token required';

  if (config.onAuthFailure) {
    config.onAuthFailure(req, reason);
  }

  return { authorized: false, reason };
}

/**
 * Creates an unauthorized response
 * Returns minimal information to prevent data leakage
 */
export function createUnauthorizedResponse(strictMode: boolean = true): {
  status: number;
  body: { error: string; message?: string };
} {
  if (strictMode) {
    // Minimal response - no additional information
    return {
      status: 401,
      body: {
        error: 'Unauthorized'
      }
    };
  }

  // Non-strict mode (for development/debugging)
  return {
    status: 401,
    body: {
      error: 'Unauthorized',
      message: 'Health check requires authentication'
    }
  };
}

/**
 * Determine if environment requires authentication
 */
export function shouldRequireAuth(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.REQUIRE_HEALTHCHECK_AUTH === 'true';
}
