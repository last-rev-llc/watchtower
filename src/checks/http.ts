/**
 * HTTP Health Check
 * Generic HTTP endpoint checking
 */

import type { Check, StatusNode, HttpCheckConfig } from '../core/types';
import { createStatusNode, aggregateStatus, getStatusMessage } from '../core/aggregator';
import { createHttpClient } from '../utils/http-client';

/**
 * Create an HTTP health check
 */
export function createHttpCheck(config: HttpCheckConfig): Check {
  return {
    id: 'http',
    name: 'HTTP Endpoints',
    async run(): Promise<StatusNode> {
      try {
        const httpClient = createHttpClient();
        const timeout = config.timeout || 5000;
        const retries = config.retries || 2;

        const checks = await Promise.all(
          config.endpoints.map(async (endpoint) => {
            try {
              const result = await httpClient.checkEndpoint(endpoint.path, endpoint.name, {
                method: endpoint.method || 'GET',
                expectedStatus: endpoint.expectedStatus || 200,
                headers: endpoint.headers,
                body: endpoint.body,
                timeout,
                retries
              });
              return result;
            } catch (error) {
              return createStatusNode(
                `http_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
                endpoint.name,
                'Unknown',
                `Check failed: ${(error as Error).message}`,
                undefined
              );
            }
          })
        );

        if (checks.length === 0) {
          return createStatusNode(
            'http',
            'HTTP Endpoints',
            'Up',
            'No endpoints configured for checking',
            undefined
          );
        }

        const overallStatus = aggregateStatus(checks);
        return createStatusNode(
          'http',
          'HTTP Endpoints',
          overallStatus,
          getStatusMessage(overallStatus, 'HTTP Endpoints'),
          checks,
          { totalEndpoints: config.endpoints.length }
        );
      } catch (error) {
        return createStatusNode(
          'http',
          'HTTP Endpoints',
          'Partial',
          `HTTP checks unavailable: ${(error as Error).message}`,
          undefined,
          { note: 'HTTP checks failed but not critical' }
        );
      }
    }
  };
}
