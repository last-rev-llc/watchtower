/**
 * Core types for Watchtower healthcheck system
 */

export type Status = 'Up' | 'Down' | 'Partial' | 'Unknown';

export type SanitizeStrategy = 'none' | 'redact-values' | 'counts-only';

/**
 * Represents a single check result or a group of checks
 */
export interface StatusNode {
  id: string;
  name: string;
  status: Status;
  message: string;
  timestamp: number;
  services?: StatusNode[];
  metadata?: Record<string, unknown>;
}

/**
 * Performance metrics for the overall healthcheck
 */
export interface PerformanceMetrics {
  totalCheckTime: number;
  checksCompleted: number;
  checksFailed: number;
}

/**
 * Complete healthcheck response
 */
export interface HealthCheckResponse {
  id: string;
  name: string;
  status: Status;
  message: string;
  timestamp: number;
  performance: PerformanceMetrics;
  services: StatusNode[];
}

/**
 * Base interface that all checks must implement
 */
export interface Check {
  id: string;
  name: string;
  run(): Promise<StatusNode>;
}

/**
 * Configuration for the healthcheck runner
 */
export interface RunnerConfig {
  checks: Check[];
  budgetMs?: number;
  cacheMs?: number;
  aggregationPrecedence?: Status[];
  auth?: AuthConfig;
  sanitize?: SanitizeStrategy;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  token?: string;
  allowMonitoring?: boolean;
  customValidator?: (req: unknown) => boolean;
}

/**
 * Cache entry for storing check results
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ============================================================================
// Check-specific configuration types
// ============================================================================

/**
 * Threshold configuration for counts
 */
export interface Thresholds {
  critical: number;
  warning: number;
}

/**
 * Configuration for Algolia checks
 */
export interface AlgoliaCheckConfig {
  indexName: string;
  applicationId?: string;
  apiKey?: string;
  useSearchKey?: boolean;
  thresholds?: {
    totalRecords?: Thresholds;
    categories?: Record<
      string,
      Thresholds & {
        actualField?: string;
        actualValue?: string;
      }
    >;
  };
  skipHeavyFacets?: boolean;
  timeout?: number;
}

/**
 * Configuration for page checks
 */
export interface PageCheckConfig {
  path: string;
  name: string;
  method?: 'GET' | 'POST';
  expectedStatus?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface PagesCheckConfig {
  critical?: PageCheckConfig[];
  important?: PageCheckConfig[];
  timeout?: number;
  retries?: number;
}

/**
 * Configuration for HTTP endpoint checks
 */
export interface HttpCheckConfig {
  endpoints: Array<{
    path: string;
    name: string;
    method?: 'GET' | 'POST';
    expectedStatus?: number;
    headers?: Record<string, string>;
    body?: unknown;
  }>;
  timeout?: number;
  retries?: number;
}

/**
 * Configuration for build integrity checks
 */
export interface BuildCheckConfig {
  criticalEnv?: string[];
  optionalEnv?: string[];
  checkPackageJson?: boolean;
  checkNodeVersion?: boolean;
}

/**
 * Result from Algolia search operations
 */
export interface AlgoliaSearchResult {
  nbHits: number;
  hits: unknown[];
  facets?: Record<string, Record<string, number>>;
}

