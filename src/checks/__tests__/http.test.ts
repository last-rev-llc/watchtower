import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpCheck } from '../http';
import type { StatusNode } from '../../core/types';

let checkEndpointMock: ReturnType<typeof vi.fn>;

vi.mock('../../utils/http-client', () => ({
  createHttpClient: () => ({
    checkEndpoint: (...args: unknown[]) => checkEndpointMock(...args)
  })
}));

describe('createHttpCheck', () => {
  beforeEach(() => {
    checkEndpointMock = vi.fn();
  });

  it('returns Up when all endpoints succeed', async () => {
    checkEndpointMock.mockResolvedValue({
      id: 'http_/ping',
      name: 'Ping',
      status: 'Up',
      message: '200 OK',
      timestamp: Date.now()
    } satisfies StatusNode);

    const check = createHttpCheck({
      endpoints: [{ path: '/ping', name: 'Ping' }]
    });

    const result = await check.run();
    expect(result.status).toBe('Up');
    expect(result.services?.[0].name).toBe('Ping');
    expect(result.metadata).toMatchObject({ totalEndpoints: 1 });
  });

  it('handles per-endpoint failure by marking Unknown', async () => {
    checkEndpointMock.mockRejectedValue(new Error('boom'));

    const check = createHttpCheck({
      endpoints: [{ path: '/ping', name: 'Ping' }]
    });

    const result = await check.run();
    expect(result.status).toBe('Unknown');
    expect(result.services?.[0].status).toBe('Unknown');
    expect(result.services?.[0].message).toContain('Check failed: boom');
  });

  it('returns Up with message when no endpoints configured', async () => {
    const check = createHttpCheck({
      endpoints: []
    });

    const result = await check.run();
    expect(result.status).toBe('Up');
    expect(result.message).toContain('No endpoints configured');
  });
});
