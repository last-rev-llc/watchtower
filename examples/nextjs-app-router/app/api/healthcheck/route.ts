/**
 * Next.js App Router Healthcheck API Route
 * Example implementation using Watchtower
 */

import { createNextHandler } from '@last-rev/watchtower';
import config from '../../../../healthcheck.config';

export const GET = createNextHandler(config);
