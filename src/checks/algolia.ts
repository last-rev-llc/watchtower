/**
 * Algolia Search Health Check
 * Fixed implementation using proper index.initIndex() pattern
 */

import type {
  Check,
  StatusNode,
  AlgoliaCheckConfig,
  AlgoliaSearchResult,
  Status
} from '../core/types';
import {
  createStatusNode,
  aggregateStatus,
  getStatusMessage,
  measureTime
} from '../core/aggregator';

// Algolia v5 client types - uses direct methods, not initIndex
type AlgoliaV5Client = {
  getSettings: (params: { indexName: string }) => Promise<unknown>;
  searchSingleIndex: (params: {
    indexName: string;
    searchParams: {
      query?: string;
      hitsPerPage?: number;
      filters?: string;
      facets?: string[];
      maxValuesPerFacet?: number;
      analytics?: boolean;
      clickAnalytics?: boolean;
      enableABTest?: boolean;
    };
  }) => Promise<{
    nbHits: number;
    hits: unknown[];
    facets?: Record<string, Record<string, number>>;
  }>;
  searchForFacetValues: (params: {
    indexName: string;
    facetName: string;
    facetQuery: string;
    searchParams?: { maxFacetHits?: number };
  }) => Promise<{
    facetHits: Array<{ value: string; count: number }>;
  }>;
};

/**
 * Algolia client wrapper with fixed API usage
 */
class AlgoliaClient {
  private client: AlgoliaV5Client;
  private indexName: string;
  private skipHeavyFacets: boolean;

  constructor(config: AlgoliaCheckConfig, client: AlgoliaV5Client) {
    this.client = client;
    this.indexName = config.indexName;
    this.skipHeavyFacets = config.skipHeavyFacets || false;
  }

  /**
   * Check if the index exists
   * Fixed: Check for both status and statusCode
   */
  async indexExists(): Promise<boolean> {
    try {
      await this.client.getSettings({ indexName: this.indexName });
      return true;
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number };
      if (err.status === 404 || err.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get basic index statistics
   * Fixed: Uses index.search() with proper params
   */
  async getIndexStats(): Promise<{
    nbHits: number;
    localeBreakdown?: Record<string, number>;
    previewBreakdown?: Record<string, number>;
  }> {
    const result = await this.client.searchSingleIndex({
      indexName: this.indexName,
      searchParams: {
        query: '',
        hitsPerPage: 0,
        analytics: false,
        clickAnalytics: false,
        enableABTest: false,
        facets: this.skipHeavyFacets ? ['locale', 'preview'] : ['*'],
        maxValuesPerFacet: 1000
      }
    });

    return {
      nbHits: result.nbHits,
      localeBreakdown: result.facets?.locale,
      previewBreakdown: result.facets?.preview
    };
  }

  /**
   * Get total record count with production/preview breakdown
   */
  async getTotalRecordCount(): Promise<{
    total: number;
    productionCount: number;
    previewCount: number;
  }> {
    // Query all records
    const allRecords = await this.client.searchSingleIndex({
      indexName: this.indexName,
      searchParams: {
        query: '',
        hitsPerPage: 0,
        analytics: false,
        clickAnalytics: false,
        enableABTest: false
      }
    });

    // Query production records
    const production = await this.client.searchSingleIndex({
      indexName: this.indexName,
      searchParams: {
        query: '',
        hitsPerPage: 0,
        filters: 'preview:false',
        analytics: false,
        clickAnalytics: false,
        enableABTest: false
      }
    });

    // Query preview records
    const preview = await this.client.searchSingleIndex({
      indexName: this.indexName,
      searchParams: {
        query: '',
        hitsPerPage: 0,
        filters: 'preview:true',
        analytics: false,
        clickAnalytics: false,
        enableABTest: false
      }
    });

    return {
      total: allRecords.nbHits,
      productionCount: production.nbHits,
      previewCount: preview.nbHits
    };
  }

  /**
   * Search with custom filter
   * Fixed: Uses index.search() properly
   */
  async searchWithFilter(filter: string): Promise<AlgoliaSearchResult> {
    const result = await this.client.searchSingleIndex({
      indexName: this.indexName,
      searchParams: {
        query: '',
        filters: filter,
        hitsPerPage: 0,
        analytics: false,
        clickAnalytics: false,
        enableABTest: false
      }
    });

    return {
      nbHits: result.nbHits,
      hits: result.hits,
      facets: result.facets
    };
  }

  /**
   * Get facet values for a specific attribute
   * Fixed: Uses index.searchForFacetValues() properly
   */
  async getFacetValues(attribute: string): Promise<Record<string, number>> {
    const result = await this.client.searchForFacetValues({
      indexName: this.indexName,
      facetName: attribute,
      facetQuery: '',
      searchParams: { maxFacetHits: 100 }
    });

    return Object.fromEntries(result.facetHits.map((hit) => [hit.value, hit.count]));
  }

  /**
   * Test basic search functionality
   */
  async testSearch(): Promise<boolean> {
    try {
      await this.client.searchSingleIndex({
        indexName: this.indexName,
        searchParams: {
          query: '',
          hitsPerPage: 1,
          analytics: false
        }
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create an Algolia health check
 */
export function createAlgoliaCheck(config: AlgoliaCheckConfig): Check {
  return {
    id: 'algolia',
    name: 'Algolia Search',
    async run(): Promise<StatusNode> {
      try {
        // Dynamically import algoliasearch (peer dependency)
        const { algoliasearch } = await import('algoliasearch');

        // Get credentials
        const applicationId = config.applicationId || process.env.ALGOLIA_APPLICATION_ID;
        const apiKey =
          config.apiKey ||
          (config.useSearchKey
            ? process.env.ALGOLIA_SEARCH_API_KEY
            : process.env.ALGOLIA_ADMIN_API_KEY);

        if (!applicationId || !apiKey) {
          return createStatusNode(
            'algolia',
            'Algolia Search',
            'Unknown',
            'Algolia credentials not configured',
            undefined,
            {
              note: 'Set ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY or ALGOLIA_SEARCH_API_KEY'
            }
          );
        }

        const searchClient = algoliasearch(applicationId, apiKey);
        const client = new AlgoliaClient(config, searchClient as unknown as AlgoliaV5Client);
        const checks: StatusNode[] = [];

        // 1. Index existence check
        const { result: exists, duration: existsDuration } = await measureTime(() =>
          client.indexExists()
        );

        if (!exists) {
          return createStatusNode(
            'algolia',
            'Algolia Search',
            'Down',
            `Index "${config.indexName}" does not exist`,
            undefined,
            { duration: existsDuration }
          );
        }

        checks.push(
          createStatusNode(
            'index_existence',
            'Index Existence',
            'Up',
            `Index exists (${existsDuration}ms)`,
            undefined,
            { duration: existsDuration }
          )
        );

        // 2. Record count check
        if (config.thresholds?.totalRecords) {
          const { result: counts, duration } = await measureTime(() =>
            client.getTotalRecordCount()
          );
          const threshold = config.thresholds.totalRecords;

          let status: Status = 'Up';
          let message = `${counts.total} total records (${duration}ms)`;

          if (counts.total < threshold.critical) {
            status = 'Down';
            message = `Critical: Only ${counts.total} records (minimum: ${threshold.critical})`;
          } else if (counts.total < threshold.warning) {
            status = 'Partial';
            message = `Warning: ${counts.total} records (recommended: ${threshold.warning})`;
          }

          checks.push(
            createStatusNode('record_count', 'Record Count', status, message, undefined, {
              duration,
              totalRecords: counts.total,
              productionRecords: counts.productionCount,
              previewRecords: counts.previewCount,
              thresholds: threshold
            })
          );
        }

        // 3. Search functionality check
        const { result: searchWorks, duration: searchDuration } = await measureTime(() =>
          client.testSearch()
        );

        checks.push(
          createStatusNode(
            'search_functionality',
            'Search Functionality',
            searchWorks ? 'Up' : 'Down',
            searchWorks ? `Search functional (${searchDuration}ms)` : 'Search failed',
            undefined,
            { duration: searchDuration }
          )
        );

        // 4. Category checks (if configured)
        if (config.thresholds?.categories) {
          const categoryChecks: StatusNode[] = [];

          for (const [categoryName, threshold] of Object.entries(config.thresholds.categories)) {
            const field = threshold.actualField || 'categories';
            const value = threshold.actualValue || categoryName;
            const filter = `${field}:"${value}"`;

            try {
              const { result: searchResult, duration } = await measureTime(() =>
                client.searchWithFilter(filter)
              );

              let status: Status = 'Up';
              let message = `${searchResult.nbHits} records (${duration}ms)`;

              if (searchResult.nbHits < threshold.critical) {
                status = 'Down';
                message = `Critical: Only ${searchResult.nbHits} (minimum: ${threshold.critical})`;
              } else if (searchResult.nbHits < threshold.warning) {
                status = 'Partial';
                message = `Warning: ${searchResult.nbHits} (recommended: ${threshold.warning})`;
              }

              categoryChecks.push(
                createStatusNode(
                  `category_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
                  categoryName,
                  status,
                  message,
                  undefined,
                  {
                    duration,
                    recordCount: searchResult.nbHits,
                    filter,
                    thresholds: threshold
                  }
                )
              );
            } catch (error) {
              categoryChecks.push(
                createStatusNode(
                  `category_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
                  categoryName,
                  'Unknown',
                  `Check failed: ${(error as Error).message}`,
                  undefined
                )
              );
            }
          }

          const catStatus = aggregateStatus(categoryChecks);
          checks.push(
            createStatusNode(
              'categories',
              'Categories',
              catStatus,
              getStatusMessage(catStatus, 'Categories'),
              categoryChecks
            )
          );
        }

        // Aggregate all checks
        const overallStatus = aggregateStatus(checks);
        return createStatusNode(
          'algolia',
          'Algolia Search',
          overallStatus,
          getStatusMessage(overallStatus, 'Algolia Search'),
          checks
        );
      } catch (error) {
        return createStatusNode(
          'algolia',
          'Algolia Search',
          'Unknown',
          `Unexpected error: ${(error as Error).message}`,
          undefined
        );
      }
    }
  };
}
