import { afterEach, describe, expect, it, vi } from 'vitest';

import cache from '../../utils/cache';
import { runHealthCheck, withTimeout } from '../runner';
import type { RunnerConfig, StatusNode } from '../types';

afterEach(() => {
  cache.clear();
  vi.useRealTimers();
});

describe('runHealthCheck', () => {
  it('returns budget exceeded when checks exceed budget', async () => {
    const config: RunnerConfig = {
      checks: [
        {
          id: 'slow',
          name: 'Slow Check',
          run: () =>
            new Promise<StatusNode>((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    id: 'slow',
                    name: 'Slow Check',
                    status: 'Up',
                    message: 'ok',
                    timestamp: Date.now()
                  }),
                50
              )
            )
        }
      ],
      budgetMs: 10,
      auth: { requireAuth: false }
    };

    const result = await runHealthCheck(config);
    expect(result.status).toBe('Partial');
    expect(result.services[0].id).toBe('budget_exceeded');
    expect(result.services[0].message).toContain('budget');
  });

  it('returns cached result when cacheMs > 0', async () => {
    let runCount = 0;
    const config: RunnerConfig = {
      checks: [
        {
          id: 'cached',
          name: 'Cached',
          run: async () => {
            runCount++;
            return {
              id: 'cached',
              name: 'Cached',
              status: 'Up',
              message: 'ok',
              timestamp: Date.now(),
              metadata: { runCount }
            };
          }
        }
      ],
      cacheMs: 1000,
      auth: { requireAuth: false }
    };

    const first = await runHealthCheck(config);
    const second = await runHealthCheck(config);

    expect(first.services[0].metadata).toMatchObject({ runCount: 1 });
    expect(second.services[0].metadata).toMatchObject({ runCount: 1 });
    expect(runCount).toBe(1);
  });

  it('handles check errors gracefully', async () => {
    const config: RunnerConfig = {
      checks: [
        {
          id: 'boom',
          name: 'Boom',
          run: async () => {
            throw new Error('boom');
          }
        }
      ],
      auth: { requireAuth: false }
    };

    const result = await runHealthCheck(config);
    expect(result.status).toBe('Unknown');
    expect(result.services[0].message).toContain('Check error: boom');
  });
});

describe('withTimeout', () => {
  it('returns timeout value when promise exceeds timeout', async () => {
    vi.useFakeTimers();

    const slowPromise = new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 20));
    const timed = withTimeout(slowPromise, 5, 'timeout');

    vi.advanceTimersByTime(10);
    await expect(timed).resolves.toBe('timeout');
  });

  it('returns promise result when it resolves before timeout', async () => {
    const fastPromise = Promise.resolve('fast');
    await expect(withTimeout(fastPromise, 50, 'timeout')).resolves.toBe('fast');
  });
});
