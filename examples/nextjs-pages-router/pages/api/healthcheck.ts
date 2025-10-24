/**
 * Next.js Healthcheck API Route
 */

import { createNextHandler } from '@last-rev/watchtower';
import config from '../../../healthcheck.config';

export default createNextHandler(config);
