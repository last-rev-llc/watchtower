import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBuildCheck } from '../build';

vi.mock('fs', () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  return {
    default: { existsSync, readFileSync },
    existsSync,
    readFileSync
  };
});

import fs from 'fs';

const fsMock = fs as unknown as {
  existsSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

describe('createBuildCheck', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    fsMock.existsSync.mockReset();
    fsMock.readFileSync.mockReset();
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readFileSync.mockReturnValue(JSON.stringify({ name: 'pkg', version: '1.0.0' }));
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns Up when package exists and critical envs present', async () => {
    process.env.CRIT = 'yes';
    const check = createBuildCheck({
      criticalEnv: ['CRIT'],
      optionalEnv: ['OPT']
    });

    const result = await check.run();
    expect(result.status).toBe('Up');

    const critical = result.services?.find((s) => s.id === 'critical_env_vars');
    expect(critical?.status).toBe('Up');
    const optional = result.services?.find((s) => s.id === 'optional_env_vars');
    expect(optional?.status).toBe('Up');
  });

  it('marks build Down when critical envs are missing', async () => {
    const check = createBuildCheck({
      criticalEnv: ['CRIT']
    });

    const result = await check.run();
    expect(result.status).toBe('Down');

    const critical = result.services?.find((s) => s.id === 'critical_env_vars');
    expect(critical?.status).toBe('Down');
    expect(critical?.message).toContain('Missing');
  });
});
