import type { HealthCheckResponse, StatusNode, SanitizeStrategy } from './types';

/**
 * Sanitizes healthcheck responses based on the selected strategy
 */
export function sanitizeResponse(
  response: HealthCheckResponse,
  strategy: SanitizeStrategy = 'none'
): HealthCheckResponse {
  if (strategy === 'none') {
    return response;
  }

  // Deep clone to avoid mutations
  const sanitized = JSON.parse(JSON.stringify(response)) as HealthCheckResponse;

  if (strategy === 'counts-only') {
    return sanitizeCountsOnly(sanitized);
  }

  if (strategy === 'redact-values') {
    return sanitizeRedactValues(sanitized);
  }

  return sanitized;
}

/**
 * Counts-only strategy: Only show counts, never leak which variables exist
 * Most secure option for production
 */
function sanitizeCountsOnly(response: HealthCheckResponse): HealthCheckResponse {
  // Sanitize environment variables - don't leak which vars exist
  const envVarService = findNestedService(response.services, 'Environment Variables');
  if (envVarService?.metadata) {
    const meta = envVarService.metadata as {
      critical?: { present?: unknown[]; missing?: unknown[]; total?: number };
      optional?: { present?: unknown[]; missing?: unknown[]; total?: number };
    };

    envVarService.metadata = {
      critical: {
        presentCount: meta.critical?.present?.length || 0,
        missingCount: meta.critical?.missing?.length || 0,
        total: meta.critical?.total || 0,
      },
      optional: {
        presentCount: meta.optional?.present?.length || 0,
        missingCount: meta.optional?.missing?.length || 0,
        total: meta.optional?.total || 0,
      },
      note: 'Details hidden for security (counts only)',
    };
    envVarService.message = 'Environment variables check completed';
  }

  // Sanitize build details
  const buildService = findNestedService(response.services, 'Build Artifacts');
  if (buildService?.metadata) {
    const meta = buildService.metadata as { checks?: unknown[] };
    buildService.metadata = {
      checksCompleted: meta.checks?.length || 0,
      status: buildService.status,
    };
    buildService.message = 'Build artifacts verified';
  }

  // Sanitize error messages
  sanitizeErrorMessages(response.services);

  // Round performance metrics to nearest 100ms (reduces fingerprinting)
  response.performance.totalCheckTime =
    Math.round(response.performance.totalCheckTime / 100) * 100;

  return response;
}

/**
 * Redact-values strategy: Mask sensitive values but show structure
 * Moderate security for internal monitoring
 */
function sanitizeRedactValues(response: HealthCheckResponse): HealthCheckResponse {
  // Mask environment variable values
  const envVarService = findNestedService(response.services, 'Environment Variables');
  if (envVarService?.metadata) {
    const meta = envVarService.metadata as {
      critical?: { present?: string[]; missing?: string[] };
      optional?: { present?: string[]; missing?: string[] };
    };

    const maskValue = (val: string) => val.replace(/./g, '*');

    envVarService.metadata = {
      critical: {
        present: meta.critical?.present?.map(maskValue) || [],
        missing: meta.critical?.missing?.map(maskValue) || [],
        total: (meta.critical?.present?.length || 0) + (meta.critical?.missing?.length || 0),
      },
      optional: {
        present: meta.optional?.present?.map(maskValue) || [],
        missing: meta.optional?.missing?.map(maskValue) || [],
        total: (meta.optional?.present?.length || 0) + (meta.optional?.missing?.length || 0),
      },
      note: 'Variable names masked for security',
    };
  }

  // Sanitize URLs in metadata
  sanitizeUrls(response.services);

  return response;
}

/**
 * Sanitize error messages to be less specific
 */
function sanitizeErrorMessages(services: StatusNode[]): void {
  for (const service of services) {
    if (service.status === 'Down' || service.status === 'Unknown') {
      // Keep critical error messages but make them less specific
      if (service.message.includes('Algolia')) {
        service.message = 'Search service unavailable';
      } else if (service.message.includes('GraphQL') || service.message.includes('API')) {
        service.message = 'API service unavailable';
      } else if (service.message.toLowerCase().includes('timeout')) {
        service.message = 'Service timeout';
      } else if (service.message.toLowerCase().includes('connection')) {
        service.message = 'Connection failed';
      } else {
        service.message = `${service.name} check failed`;
      }
    }

    if (service.services) {
      sanitizeErrorMessages(service.services);
    }
  }
}

/**
 * Sanitize URLs in metadata to remove sensitive query params
 */
function sanitizeUrls(services: StatusNode[]): void {
  for (const service of services) {
    if (service.metadata?.url) {
      try {
        const url = new URL(service.metadata.url as string);
        // Remove query parameters that might contain sensitive data
        url.search = '';
        service.metadata.url = url.toString();
      } catch {
        // If URL parsing fails, just mask it
        service.metadata.url = '[URL_REDACTED]';
      }
    }

    if (service.services) {
      sanitizeUrls(service.services);
    }
  }
}

/**
 * Helper to find a nested service by name
 */
function findNestedService(services: StatusNode[], name: string): StatusNode | undefined {
  for (const service of services) {
    if (service.name === name) {
      return service;
    }
    if (service.services) {
      const found = findNestedService(service.services, name);
      if (found) return found;
    }
  }
  return undefined;
}

