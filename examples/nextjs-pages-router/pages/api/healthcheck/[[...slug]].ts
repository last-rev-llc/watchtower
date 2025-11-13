/**
 * Next.js Healthcheck API Route with Test Page Support
 *
 * This optional catch-all route ([[...slug]]) handles both:
 * - /api/healthcheck (main endpoint)
 * - /api/healthcheck/test (test page, if enableTestPage is enabled)
 *
 * Note: Using optional catch-all (double brackets) allows matching
 * the base path. A regular catch-all ([...slug]) won't match /api/healthcheck.
 */

import { createNextHandler } from '@last-rev/watchtower';
import config from '../../../../healthcheck.config';

export default createNextHandler(config);
