import { describe, expect, it } from 'vitest';

import type { HealthCheckResponse } from '../types';
import { sanitizeResponse } from '../sanitizer';

function buildResponse(): HealthCheckResponse {
  return {
    id: 'site_healthcheck',
    name: 'Site Health',
    status: 'Partial',
    message: 'Some services degraded',
    timestamp: Date.now(),
    performance: {
      totalCheckTime: 1234,
      checksCompleted: 2,
      checksFailed: 1
    },
    services: [
      {
        id: 'env',
        name: 'Environment Variables',
        status: 'Up',
        message: 'ok',
        timestamp: Date.now(),
        metadata: {
          critical: { present: ['API_KEY'], missing: ['DB_URL'], total: 2 },
          optional: { present: ['FEATURE_FLAG'], missing: [], total: 1 }
        }
      },
      {
        id: 'build',
        name: 'Build Artifacts',
        status: 'Up',
        message: 'ok',
        timestamp: Date.now(),
        metadata: { checks: ['bundle', 'assets'] }
      },
      {
        id: 'search',
        name: 'Algolia',
        status: 'Down',
        message: 'Algolia timeout error',
        timestamp: Date.now()
      }
    ]
  };
}

describe('sanitizeResponse', () => {
  it('applies counts-only strategy', () => {
    const response = buildResponse();
    const sanitized = sanitizeResponse(response, 'counts-only');

    const envService = sanitized.services.find((s) => s.name === 'Environment Variables');
    expect(envService?.metadata).toEqual({
      critical: { presentCount: 1, missingCount: 1, total: 2 },
      optional: { presentCount: 1, missingCount: 0, total: 1 },
      note: 'Details hidden for security (counts only)'
    });
    expect(envService?.message).toBe('Environment variables check completed');

    const buildService = sanitized.services.find((s) => s.name === 'Build Artifacts');
    expect(buildService?.metadata).toEqual({
      checksCompleted: 2,
      status: 'Up'
    });
    expect(buildService?.message).toBe('Build artifacts verified');

    const searchService = sanitized.services.find((s) => s.name === 'Algolia');
    expect(searchService?.message).toBe('Search service unavailable');

    expect(sanitized.performance.totalCheckTime).toBe(1200);
  });

  it('applies redact-values strategy', () => {
    const response = buildResponse();
    // add URL metadata for sanitization coverage
    response.services.push({
      id: 'url-service',
      name: 'Url Service',
      status: 'Up',
      message: 'ok',
      timestamp: Date.now(),
      metadata: { url: 'https://example.com/path?token=secret' }
    });
    response.services.push({
      id: 'bad-url',
      name: 'Bad Url',
      status: 'Up',
      message: 'ok',
      timestamp: Date.now(),
      metadata: { url: '::::' }
    });

    const sanitized = sanitizeResponse(response, 'redact-values');

    const envService = sanitized.services.find((s) => s.name === 'Environment Variables');
    expect(envService?.metadata).toEqual({
      critical: {
        present: ['*******'],
        missing: ['******'],
        total: 2
      },
      optional: {
        present: ['************'],
        missing: [],
        total: 1
      },
      note: 'Variable names masked for security'
    });

    const urlService = sanitized.services.find((s) => s.id === 'url-service');
    expect(urlService?.metadata).toEqual({ url: 'https://example.com/path' });

    const badUrlService = sanitized.services.find((s) => s.id === 'bad-url');
    expect(badUrlService?.metadata).toEqual({ url: '[URL_REDACTED]' });
  });
});
