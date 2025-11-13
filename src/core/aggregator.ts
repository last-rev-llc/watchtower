import type { Status, StatusNode } from './types';

/**
 * Default status precedence: Down > Partial > Unknown > Up
 * This can be configured via RunnerConfig
 */
const DEFAULT_PRECEDENCE: Status[] = ['Down', 'Partial', 'Unknown', 'Up'];

/**
 * Determines the overall status based on child service statuses
 * with configurable precedence
 */
export function aggregateStatus(
  services: StatusNode[],
  precedence: Status[] = DEFAULT_PRECEDENCE
): Status {
  if (!services || services.length === 0) {
    return 'Unknown';
  }

  const statuses = services.map((service) => service.status);

  // Apply precedence order
  for (const status of precedence) {
    if (statuses.includes(status)) {
      return status;
    }
  }

  // If all services are Up, return Up
  if (statuses.every((status) => status === 'Up')) {
    return 'Up';
  }

  // Fallback
  return 'Partial';
}

/**
 * Generates an appropriate message based on aggregated status
 */
export function getStatusMessage(status: Status, serviceName?: string): string {
  const prefix = serviceName ? `${serviceName}: ` : '';

  switch (status) {
    case 'Up':
      return `${prefix}All systems operational`;
    case 'Partial':
      return `${prefix}Some services degraded`;
    case 'Down':
      return `${prefix}Critical services unavailable`;
    case 'Unknown':
      return `${prefix}Unable to determine status`;
    default:
      return `${prefix}Status unknown`;
  }
}

/**
 * Creates a standardized status node with timestamp
 */
export function createStatusNode(
  id: string,
  name: string,
  status: Status,
  message: string,
  services?: StatusNode[],
  metadata?: Record<string, unknown>
): StatusNode {
  return {
    id,
    name,
    status,
    message,
    timestamp: Date.now(),
    ...(services && services.length > 0 && { services }),
    ...(metadata && Object.keys(metadata).length > 0 && { metadata })
  };
}

/**
 * Gets the site name for healthcheck responses
 * Uses SITE environment variable, with DOMAIN as fallback
 */
export function getSiteName(req?: unknown): string {
  // Check request parameters first (allows override)
  const reqObj = req as { query?: { site?: string }; headers?: Record<string, string> };

  if (reqObj?.query?.site) {
    return reqObj.query.site.toLowerCase();
  }

  if (reqObj?.headers?.['x-site-name']) {
    return reqObj.headers['x-site-name'].toLowerCase();
  }

  // Try environment variables
  const siteFromEnv = process.env.SITE;
  const domainFromEnv = process.env.DOMAIN;

  if (siteFromEnv) {
    return siteFromEnv.toLowerCase();
  }

  if (domainFromEnv) {
    // Extract site name from domain (e.g., "example.com" -> "example")
    const domainMatch = domainFromEnv.match(/^https?:\/\/([^.]+)\./);
    if (domainMatch) {
      return domainMatch[1].toLowerCase();
    }

    // Try without protocol
    const simpleDomainMatch = domainFromEnv.match(/^([^.]+)\./);
    if (simpleDomainMatch) {
      return simpleDomainMatch[1].toLowerCase();
    }
  }

  // Final fallback
  return 'site';
}

/**
 * Gets the full site display name for healthcheck responses
 */
export function getSiteDisplayName(req?: unknown): string {
  const siteName = getSiteName(req);
  return `${siteName.charAt(0).toUpperCase() + siteName.slice(1)} Site Health`;
}

/**
 * Gets the site healthcheck ID
 */
export function getSiteHealthcheckId(req?: unknown): string {
  const siteName = getSiteName(req).toLowerCase();
  return `${siteName}_healthcheck`;
}

/**
 * Measures execution time of an async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}
