/**
 * Contentful Site Template
 * Pre-configured healthcheck for typical Contentful + Algolia + Next.js sites
 */

import type { RunnerConfig } from '../core/types';
import { createAlgoliaCheck } from '../checks/algolia';
import { createHttpCheck } from '../checks/http';
import { createBuildCheck } from '../checks/build';

interface ContentfulSiteConfig {
  algolia?: {
    indexName?: string;
    applicationId?: string;
    apiKey?: string;
    useSearchKey?: boolean;
    thresholds?: {
      totalRecords?: { critical: number; warning: number };
      categories?: Record<
        string,
        {
          critical: number;
          warning: number;
          actualField?: string;
          actualValue?: string;
        }
      >;
    };
    skipHeavyFacets?: boolean;
  };
  contentful?: {
    spaceId?: string;
    environment?: string;
    deliveryToken?: string;
    previewToken?: string;
  };
  siteUrl?: string;
  performance?: {
    budgetMs?: number;
    cacheMs?: number;
  };
  security?: {
    auth?: {
      token?: string;
      allowMonitoring?: boolean;
    };
    sanitize?: 'none' | 'redact-values' | 'counts-only';
  };
}

export function contentfulSiteTemplate(config: ContentfulSiteConfig = {}): RunnerConfig {
  const checks = [];

  // Algolia check (if configured)
  if (config.algolia) {
    checks.push(
      createAlgoliaCheck({
        indexName: config.algolia.indexName || 'contentful',
        applicationId: config.algolia.applicationId,
        apiKey: config.algolia.apiKey,
        useSearchKey: config.algolia.useSearchKey,
        thresholds: config.algolia.thresholds,
        skipHeavyFacets: config.algolia.skipHeavyFacets
      })
    );
  }

  // Contentful API checks (if configured)
  if (config.contentful) {
    const endpoints = [];

    if (config.contentful.deliveryToken) {
      endpoints.push({
        path: `https://cdn.contentful.com/spaces/${config.contentful.spaceId}/environments/${
          config.contentful.environment || 'master'
        }`,
        name: 'Contentful Delivery API',
        headers: {
          Authorization: `Bearer ${config.contentful.deliveryToken}`
        }
      });
    }

    if (config.contentful.previewToken) {
      endpoints.push({
        path: `https://preview.contentful.com/spaces/${config.contentful.spaceId}/environments/${
          config.contentful.environment || 'master'
        }`,
        name: 'Contentful Preview API',
        headers: {
          Authorization: `Bearer ${config.contentful.previewToken}`
        }
      });
    }

    if (endpoints.length > 0) {
      checks.push(
        createHttpCheck({
          endpoints,
          timeout: 3000,
          retries: 1
        })
      );
    }
  }

  // Build integrity check
  checks.push(
    createBuildCheck({
      criticalEnv: [
        'CONTENTFUL_SPACE_ID',
        'CONTENTFUL_ENV',
        'ALGOLIA_APPLICATION_ID',
        'ALGOLIA_ADMIN_API_KEY'
      ],
      optionalEnv: [
        'NEXT_PUBLIC_SITE_URL',
        'SITE_URL',
        'DOMAIN',
        'VERCEL_URL',
        'CONTENTFUL_DELIVERY_TOKEN'
      ],
      checkPackageJson: true
    })
  );

  return {
    checks,
    budgetMs: config.performance?.budgetMs || 20000,
    cacheMs: config.performance?.cacheMs || 30000,
    aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],
    auth: config.security?.auth,
    sanitize: config.security?.sanitize || 'none'
  };
}
