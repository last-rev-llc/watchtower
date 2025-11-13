/**
 * @last-rev/watchtower
 * Main package exports
 */

// Core exports
export * from './core/types';
export { runHealthCheck } from './core/runner';
export { aggregateStatus, getStatusMessage, createStatusNode } from './core/aggregator';
export { sanitizeResponse } from './core/sanitizer';
export { validateAuth } from './core/auth';

// Check creators
export { createAlgoliaCheck } from './checks/algolia';
export { createPagesCheck } from './checks/pages';
export { createHttpCheck } from './checks/http';
export { createBuildCheck } from './checks/build';

// Adapters
export { createNextHandler } from './adapters/next';

// Templates
export { contentfulSiteTemplate } from './templates/contentful-site';
export { defaultTemplate } from './templates/default';
export { minimalTemplate } from './templates/minimal';
