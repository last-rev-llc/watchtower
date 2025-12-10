import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAlgoliaCheck } from '../algolia';

let mockClient: {
  getSettings: ReturnType<typeof vi.fn>;
  searchSingleIndex: ReturnType<typeof vi.fn>;
  searchForFacetValues: ReturnType<typeof vi.fn>;
};

const algoliasearchMock = vi.fn(() => mockClient);

vi.mock('algoliasearch', () => ({
  algoliasearch: algoliasearchMock
}));

describe('createAlgoliaCheck', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockClient = {
      getSettings: vi.fn(),
      searchSingleIndex: vi.fn(),
      searchForFacetValues: vi.fn()
    };
    algoliasearchMock.mockClear();
  });

  it('returns Unknown when credentials are missing', async () => {
    const check = createAlgoliaCheck({
      indexName: 'idx'
    });

    const result = await check.run();
    expect(result.status).toBe('Unknown');
    expect(result.message).toContain('credentials not configured');
    expect(algoliasearchMock).not.toHaveBeenCalled();
  });

  it('returns Down when index does not exist', async () => {
    const check = createAlgoliaCheck({
      indexName: 'idx',
      applicationId: 'app',
      apiKey: 'key'
    });

    mockClient.getSettings.mockRejectedValue({ status: 404 });

    const result = await check.run();
    expect(result.status).toBe('Down');
    expect(result.message).toContain('does not exist');
  });

  it('returns Up when checks succeed', async () => {
    const check = createAlgoliaCheck({
      indexName: 'idx',
      applicationId: 'app',
      apiKey: 'key',
      thresholds: {
        totalRecords: { critical: 3, warning: 5 }
      }
    });

    mockClient.getSettings.mockResolvedValue({});
    mockClient.searchSingleIndex.mockResolvedValue({
      nbHits: 10,
      hits: [],
      facets: { locale: { en: 10 }, preview: { false: 8, true: 2 } }
    });

    const result = await check.run();
    expect(result.status).toBe('Up');
    expect(result.services?.find((s) => s.id === 'record_count')?.status).toBe('Up');
    expect(result.services?.find((s) => s.id === 'search_functionality')?.status).toBe('Up');
  });
});
