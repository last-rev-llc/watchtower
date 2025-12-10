import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import cache from '../cache';

describe('SimpleCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    cache.clear();
  });

  afterEach(() => {
    cache.clear();
    vi.useRealTimers();
  });

  it('stores and retrieves values before expiry', () => {
    cache.set('foo', 123, 1000);
    expect(cache.get<number>('foo')).toBe(123);
    expect(cache.size()).toBe(1);
  });

  it('returns null and evicts expired entries', () => {
    cache.set('bar', 'value', 500);
    vi.advanceTimersByTime(600);
    expect(cache.get('bar')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('clears specific keys and all keys', () => {
    cache.set('k1', 'a', 1000);
    cache.set('k2', 'b', 1000);

    cache.clear('k1');
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBe('b');

    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('cleanup removes expired entries', () => {
    cache.set('fresh', 1, 1000);
    cache.set('old', 2, 500);

    vi.advanceTimersByTime(600);
    cache.cleanup();

    expect(cache.get('old')).toBeNull();
    expect(cache.get('fresh')).toBe(1);
  });
});
