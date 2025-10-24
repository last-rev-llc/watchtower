/**
 * Next.js API Route Adapter
 * Wraps the healthcheck runner for Next.js API routes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { RunnerConfig } from '../core/types';
import { runHealthCheck } from '../core/runner';

/**
 * Creates a Next.js API route handler for healthcheck
 */
export function createNextHandler(config: RunnerConfig) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Run the healthcheck
    const result = await runHealthCheck(config, req);

    // Set appropriate status code
    const httpStatus = result.status === 'Down' ? 503 : 200;

    // Set headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Return response
    return res.status(httpStatus).json(result);
  };
}
