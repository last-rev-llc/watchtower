import type { CacheEntry } from '../core/types';

/**
 * Simple in-memory cache for expensive check results
 * TTL-based expiration
 */
class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache with TTL in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  /**
   * Clear a specific key or all keys
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get the number of items in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
const cacheInstance = new SimpleCache();

// Cleanup expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheInstance.cleanup();
  }, 60000);
}

export default cacheInstance;

