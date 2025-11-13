/**
 * Minimal Healthcheck API Route
 * Example with only essential checks
 */

import { createNextHandler } from '@last-rev/watchtower/next';
import config from '../../../healthcheck.config';

export default createNextHandler(config);
