/**
 * Minimal Template
 * Bare minimum healthcheck
 */

import type { RunnerConfig } from '../core/types';
import { createBuildCheck } from '../checks/build';

export function minimalTemplate(): RunnerConfig {
  return {
    checks: [
      createBuildCheck({
        criticalEnv: [],
        optionalEnv: ['NODE_ENV'],
        checkPackageJson: true,
      }),
    ],
    budgetMs: 3000,
    cacheMs: 0,
    aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],
    sanitize: 'none',
  };
}
