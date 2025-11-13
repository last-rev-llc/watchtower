/**
 * Default Template
 * Basic healthcheck with common checks
 */

import type { RunnerConfig } from '../core/types';
import { createPagesCheck } from '../checks/pages';
import { createBuildCheck } from '../checks/build';

export function defaultTemplate(): RunnerConfig {
  return {
    checks: [
      createPagesCheck({
        critical: [
          { path: '/', name: 'Homepage' },
          { path: '/robots.txt', name: 'Robots.txt' },
          { path: '/sitemap.xml', name: 'Sitemap' },
          { path: '/favicon.ico', name: 'Favicon' },
        ],
        timeout: 5000,
        retries: 2,
      }),
      createBuildCheck({
        criticalEnv: ['NODE_ENV'],
        optionalEnv: ['NEXT_PUBLIC_SITE_URL', 'SITE_URL', 'DOMAIN'],
        checkPackageJson: true,
      }),
    ],
    budgetMs: 5000,
    cacheMs: 60000,
    aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],
    sanitize: process.env.NODE_ENV === 'production' ? 'counts-only' : 'none',
  };
}
