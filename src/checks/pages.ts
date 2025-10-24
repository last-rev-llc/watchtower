/**
 * Pages Health Check
 * Verifies critical pages are accessible
 */

import type { Check, StatusNode, PagesCheckConfig } from '../core/types';
import { createStatusNode, aggregateStatus, getStatusMessage } from '../core/aggregator';
import { createHttpClient } from '../utils/http-client';

/**
 * Create a pages health check
 */
export function createPagesCheck(config: PagesCheckConfig): Check {
  return {
    id: 'pages',
    name: 'Page Health',
    async run(): Promise<StatusNode> {
      try {
        const httpClient = createHttpClient();
        const checks: StatusNode[] = [];

        const timeout = config.timeout || 5000;
        const retries = config.retries || 2;

        // Check critical pages
        if (config.critical && config.critical.length > 0) {
          const criticalChecks = await Promise.all(
            config.critical.map(async (page) => {
              try {
                const result = await httpClient.checkEndpoint(page.path, page.name, {
                  method: page.method || 'GET',
                  expectedStatus: page.expectedStatus || 200,
                  timeout,
                  retries,
                  headers: page.headers,
                  body: page.body
                });
                return result;
              } catch (error) {
                return createStatusNode(
                  `page_${page.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  page.name,
                  'Unknown',
                  `Check failed: ${(error as Error).message}`,
                  undefined
                );
              }
            })
          );

          const criticalStatus = aggregateStatus(criticalChecks);
          checks.push(
            createStatusNode(
              'critical_pages',
              'Critical Pages',
              criticalStatus,
              getStatusMessage(criticalStatus, 'Critical Pages'),
              criticalChecks,
              { totalPages: config.critical.length }
            )
          );
        }

        // Check important pages (non-critical)
        if (config.important && config.important.length > 0) {
          const importantChecks = await Promise.all(
            config.important.map(async (page) => {
              try {
                const result = await httpClient.checkEndpoint(page.path, page.name, {
                  method: page.method || 'GET',
                  expectedStatus: page.expectedStatus || 200,
                  timeout,
                  retries,
                  headers: page.headers,
                  body: page.body
                });
                return result;
              } catch (error) {
                // Important pages don't fail the overall check
                return createStatusNode(
                  `page_${page.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  page.name,
                  'Partial',
                  `Check failed: ${(error as Error).message}`,
                  undefined
                );
              }
            })
          );

          const importantStatus = aggregateStatus(importantChecks);
          checks.push(
            createStatusNode(
              'important_pages',
              'Important Pages',
              importantStatus,
              getStatusMessage(importantStatus, 'Important Pages'),
              importantChecks,
              { totalPages: config.important.length }
            )
          );
        }

        if (checks.length === 0) {
          return createStatusNode(
            'pages',
            'Page Health',
            'Up',
            'No pages configured for checking',
            undefined
          );
        }

        const overallStatus = aggregateStatus(checks);
        return createStatusNode(
          'pages',
          'Page Health',
          overallStatus,
          getStatusMessage(overallStatus, 'Page Health'),
          checks
        );
      } catch (error) {
        return createStatusNode(
          'pages',
          'Page Health',
          'Partial',
          `Page checks unavailable: ${(error as Error).message}`,
          undefined,
          { note: 'Page checks failed but not critical' }
        );
      }
    }
  };
}
