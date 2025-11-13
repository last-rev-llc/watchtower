/**
 * Check Creators
 * Export all available health check creators
 */

export { createAlgoliaCheck } from './algolia';
export { createPagesCheck } from './pages';
export { createHttpCheck } from './http';
export { createBuildCheck } from './build';

// Re-export types for convenience
export type {
  AlgoliaCheckConfig,
  PagesCheckConfig,
  HttpCheckConfig,
  BuildCheckConfig,
  PageCheckConfig,
  Thresholds
} from '../core/types';
