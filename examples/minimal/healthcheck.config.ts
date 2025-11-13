/**
 * Minimal Healthcheck Configuration
 * Simplest possible setup - just checks if the app is alive
 */

import { minimalTemplate } from '@last-rev/watchtower';

// No configuration needed - returns basic build checks only
export default minimalTemplate();
