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
  /**
   * Enable a test page for browser-based healthcheck testing.
   * When enabled, accessing the endpoint with '/test' suffix will serve an interactive test page.
   *
   * @example
   * // If endpoint is /api/healthcheck, test page will be at /api/healthcheck/test
   * enableTestPage: true
   *
   * // Custom test page path
   * enableTestPage: '/test-page'
   */
  enableTestPage?: boolean | string;
}

/**
 * Authentication configuration
 *
 * Simple token-based authentication to protect healthcheck endpoints.
 *
 * Security defaults:
 * - In production: auth is REQUIRED (requireAuth defaults to true)
 * - Query parameter tokens are DISABLED by default (allowQueryToken defaults to false)
 * - Strict mode is ENABLED in production (minimal error responses)
 *
 * Token can be provided via:
 * - Authorization header: `Authorization: Bearer <token>` (recommended)
 * - Custom header: `X-Healthcheck-Token: <token>`
 * - Query parameter: `?token=<token>` (if allowQueryToken is enabled)
 */
export interface AuthConfig {
  /**
   * Required authentication token.
   * In production, if token is not provided, access will be denied.
   *
   * @example
   * token: process.env.HEALTHCHECK_TOKEN
   */
  token?: string;

  /**
   * Require authentication. Defaults to true in production environments.
   * If false, allows unauthenticated access (not recommended for production).
   */
  requireAuth?: boolean;

  /**
   * Allow query parameter tokens (e.g., ?token=xxx).
   * Defaults to false for security (query params can appear in logs).
   * Use headers instead when possible.
   */
  allowQueryToken?: boolean;

  /**
   * Strict mode: return minimal error responses to prevent information leakage.
   * Defaults to true in production environments.
   * When true, auth failures return only { "error": "Unauthorized" }
   */
  strictMode?: boolean;

  /**
   * Custom validation function. Takes precedence over token validation.
   * Should return true if request is authorized, false otherwise.
   *
   * @example
   * customValidator: (req) => {
   *   return req.headers['x-internal-token'] === process.env.INTERNAL_TOKEN;
   * }
   */
  customValidator?: (req: unknown) => boolean;

  /**
   * Optional callback for auth failures (useful for logging/alerting).
   * Receives the request object and failure reason.
   *
   * @example
   * onAuthFailure: (req, reason) => {
   *   console.warn('Healthcheck auth failed:', reason);
   * }
   */
  onAuthFailure?: (req: unknown, reason: string) => void;
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
