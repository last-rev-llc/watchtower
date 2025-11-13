/**
 * Next.js API Route Adapter
 * Wraps the healthcheck runner for Next.js API routes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { RunnerConfig } from '../core/types';
import { runHealthCheck } from '../core/runner';
import { validateAuth, createUnauthorizedResponse } from '../core/auth';

/**
 * Sets security headers on the response
 */
function setSecurityHeaders(res: NextApiResponse): void {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
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
