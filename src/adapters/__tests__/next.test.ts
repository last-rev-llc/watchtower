import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createNextHandler } from '../next';

const runHealthCheckMock = vi.fn();
const validateAuthMock = vi.fn();
const createUnauthorizedResponseMock = vi.fn();

vi.mock('../../core/runner', () => ({
  runHealthCheck: (...args: unknown[]) => runHealthCheckMock(...args)
}));

vi.mock('../../core/auth', () => ({
  validateAuth: (...args: unknown[]) => validateAuthMock(...args),
  createUnauthorizedResponse: (...args: unknown[]) => createUnauthorizedResponseMock(...args)
}));

vi.mock('../test-page', () => ({
  generateTestPage: () => '<html>test</html>'
}));

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = null;
  let sendBody: unknown = null;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (body: unknown) => {
      jsonBody = body;
      return res;
    },
    send: (body: unknown) => {
      sendBody = body;
      return res;
    },
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    get result() {
      return { statusCode, jsonBody, sendBody, headers };
    }
  };

  return res;
}

describe('createNextHandler', () => {
  beforeEach(() => {
    runHealthCheckMock.mockReset();
    validateAuthMock.mockReset();
    createUnauthorizedResponseMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects non-GET requests', async () => {
    const handler = createNextHandler({ checks: [] });
    const res = createMockRes();

    await handler({ method: 'POST' } as any, res as any);
    expect(res.result.statusCode).toBe(405);
    expect(res.result.jsonBody).toEqual({ error: 'Method not allowed' });
  });

  it('returns unauthorized when auth fails', async () => {
    validateAuthMock.mockReturnValue({ authorized: false });
    createUnauthorizedResponseMock.mockReturnValue({
      status: 401,
      body: { error: 'Unauthorized' }
    });

    const handler = createNextHandler({ checks: [], auth: {} });
    const res = createMockRes();

    await handler({ method: 'GET' } as any, res as any);

    expect(res.result.statusCode).toBe(401);
    expect(res.result.jsonBody).toEqual({ error: 'Unauthorized' });
    expect(runHealthCheckMock).not.toHaveBeenCalled();
  });

  it('serves test page when requested', async () => {
    validateAuthMock.mockReturnValue({ authorized: true });

    const handler = createNextHandler({
      checks: [],
      enableTestPage: true,
      auth: { requireAuth: false }
    });
    const res = createMockRes();

    await handler({ method: 'GET', url: '/api/healthcheck/test', query: {} } as any, res as any);

    expect(res.result.statusCode).toBe(200);
    expect(res.result.sendBody).toContain('<html>test</html>');
    expect(res.result.headers['Content-Type']).toBe('text/html');
  });

  it('returns healthcheck result with 200 when Up', async () => {
    validateAuthMock.mockReturnValue({ authorized: true });
    runHealthCheckMock.mockResolvedValue({
      status: 'Up',
      message: 'ok',
      services: [],
      id: 'site_healthcheck',
      name: 'Site Health',
      timestamp: Date.now(),
      performance: { totalCheckTime: 1, checksCompleted: 1, checksFailed: 0 }
    });

    const handler = createNextHandler({ checks: [], auth: { requireAuth: false } });
    const res = createMockRes();

    await handler({ method: 'GET', url: '/api/healthcheck' } as any, res as any);

    expect(res.result.statusCode).toBe(200);
    expect(res.result.jsonBody?.message).toBe('ok');
    expect(runHealthCheckMock).toHaveBeenCalled();
  });
});
