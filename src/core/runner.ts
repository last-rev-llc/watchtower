import type {
  Check,
  RunnerConfig,
  HealthCheckResponse,
  StatusNode,
  PerformanceMetrics
} from './types';
import {
  aggregateStatus,
  getStatusMessage,
  getSiteDisplayName,
  getSiteHealthcheckId
} from './aggregator';
import { sanitizeResponse } from './sanitizer';
import { validateAuth } from './auth';
import cache from '../utils/cache';

/**
 * Runs all configured checks with budget enforcement and caching
 */
export async function runHealthCheck(
  config: RunnerConfig,
  req?: unknown
): Promise<HealthCheckResponse> {
  const startTime = Date.now();

  // Validate authentication
  // Note: Auth failures should be handled at the adapter level to prevent information leakage
  // This check is a safety net, but adapters should check auth before calling runHealthCheck
  const authResult = validateAuth(req, config.auth);
  if (!authResult.authorized) {
    // Should never reach here (adapter should handle it)
    // But if we do, throw an error that adapters can catch
    throw new Error('UNAUTHORIZED');
  }

  const { checks, budgetMs = 5000, cacheMs = 0, aggregationPrecedence } = config;

  // Run all checks in parallel with timeout protection
  const checkPromises = checks.map((check) => runCheckWithTimeout(check, cacheMs, check.id));

  // Global budget enforcement
  const resultsPromise = Promise.allSettled(checkPromises);
  const budgetPromise = createTimeout(budgetMs);

  const result = await Promise.race([
    resultsPromise.then((r) => ({ type: 'completed' as const, results: r })),
    budgetPromise.then(() => ({ type: 'timeout' as const }))
  ]);

  let services: StatusNode[];
  let checksCompleted = 0;
  let checksFailed = 0;

  if (result.type === 'timeout') {
    // Budget exceeded - return partial results
    services = [
      {
        id: 'budget_exceeded',
        name: 'Budget Exceeded',
        status: 'Partial',
        message: `Health check exceeded ${budgetMs}ms budget`,
        timestamp: Date.now()
      }
    ];
    checksFailed = checks.length;
  } else {
    // Process results
    services = result.results.map((res, idx) => {
      if (res.status === 'fulfilled') {
        checksCompleted++;
        if (res.value.status === 'Down' || res.value.status === 'Unknown') {
          checksFailed++;
        }
        return res.value;
      } else {
        checksFailed++;
        return {
          id: checks[idx].id,
          name: checks[idx].name,
          status: 'Unknown' as const,
          message: `Check failed: ${(res.reason as Error)?.message || 'Unknown error'}`,
          timestamp: Date.now()
        };
      }
    });
  }

  // Calculate performance metrics
  const totalCheckTime = Date.now() - startTime;
  const performance: PerformanceMetrics = {
    totalCheckTime,
    checksCompleted,
    checksFailed
  };

  // Aggregate status
  const overallStatus = aggregateStatus(services, aggregationPrecedence);
  const overallMessage = getStatusMessage(overallStatus);

  // Build response
  const response: HealthCheckResponse = {
    id: getSiteHealthcheckId(req),
    name: getSiteDisplayName(req),
    status: overallStatus,
    message: overallMessage,
    timestamp: Date.now(),
    performance,
    services
  };

  // Apply sanitization
  return sanitizeResponse(response, config.sanitize);
}

/**
 * Run a single check with optional caching and timeout
 */
async function runCheckWithTimeout(
  check: Check,
  cacheMs: number,
  checkId: string
): Promise<StatusNode> {
  // Check cache first
  if (cacheMs > 0) {
    const cached = cache.get<StatusNode>(`check:${checkId}`);
    if (cached) {
      return cached;
    }
  }

  try {
    // Run the check
    const result = await check.run();

    // Cache if configured
    if (cacheMs > 0) {
      cache.set(`check:${checkId}`, result, cacheMs);
    }

    return result;
  } catch (error) {
    // Checks should never throw, but handle it gracefully
    return {
      id: checkId,
      name: check.name,
      status: 'Unknown',
      message: `Check error: ${(error as Error)?.message || 'Unknown error'}`,
      timestamp: Date.now()
    };
  }
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to create a timeout wrapper for any promise
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T
): Promise<T> {
  const timeoutPromise = createTimeout(timeoutMs).then(() => timeoutValue);
  return Promise.race([promise, timeoutPromise]);
}
