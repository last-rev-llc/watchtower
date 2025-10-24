import type { AuthConfig } from './types';

/**
 * Validates if a request should be allowed to access the healthcheck
 */
export function validateAuth(req: unknown, config?: AuthConfig): boolean {
  // If no auth config, allow all requests
  if (!config) {
    return true;
  }

  const reqObj = req as {
    headers?: Record<string, string>;
    query?: Record<string, string>;
  };

  // Check custom validator first
  if (config.customValidator) {
    return config.customValidator(req);
  }

  // Check for monitoring service user agents
  if (config.allowMonitoring) {
    const userAgent = reqObj.headers?.['user-agent']?.toLowerCase() || '';
    const monitoringServices = [
      'datadog',
      'newrelic',
      'uptimerobot',
      'pingdom',
      'statuspage',
      'monitoring',
      'healthcheck',
    ];

    if (monitoringServices.some((service) => userAgent.includes(service))) {
      return true;
    }
  }

  // Check for token in header
  if (config.token) {
    const authHeader = reqObj.headers?.authorization || '';
    const tokenHeader = reqObj.headers?.['x-healthcheck-token'] || '';
    const queryToken = reqObj.query?.token || '';

    // Bearer token
    if (authHeader.startsWith('Bearer ')) {
      const providedToken = authHeader.substring(7);
      if (providedToken === config.token) {
        return true;
      }
    }

    // Custom header
    if (tokenHeader === config.token) {
      return true;
    }

    // Query parameter (less secure, but convenient for monitoring tools)
    if (queryToken === config.token) {
      return true;
    }

    // Basic auth
    if (authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
      const [, password] = credentials.split(':');
      if (password === config.token) {
        return true;
      }
    }

    // Token not valid
    return false;
  }

  // No auth requirements, allow
  return true;
}

/**
 * Creates an unauthorized response
 */
export function createUnauthorizedResponse(): {
  status: number;
  body: { error: string; message: string };
} {
  return {
    status: 401,
    body: {
      error: 'Unauthorized',
      message: 'Health check requires authentication',
    },
  };
}

/**
 * Determine if environment requires authentication
 */
export function shouldRequireAuth(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.REQUIRE_HEALTHCHECK_AUTH === 'true'
  );
}

