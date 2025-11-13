/**
 * Example Next.js App Router Healthcheck Configuration
 * Production-ready configuration matching proven Contentful + Algolia pattern
 */

import {
  createAlgoliaCheck,
  createPagesCheck,
  createHttpCheck,
  createBuildCheck,
  type RunnerConfig
} from '@last-rev/watchtower';

const config: RunnerConfig = {
  // Performance settings
  budgetMs: 20000,
  cacheMs: 30000,
  aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],

  // Security settings
  // Token-based authentication protects the endpoint from unauthorized access
  // In production, auth is required by default
  auth: {
    token: process.env.HEALTHCHECK_TOKEN
    // Query params disabled by default (use headers instead)
    // allowQueryToken: false,
    // Strict mode enabled in production (minimal error responses)
    // strictMode: true,
  },
  sanitize: process.env.NODE_ENV === 'production' ? 'counts-only' : 'none',

  // Health checks
  checks: [
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
      ]
    }),

    createAlgoliaCheck({
      indexName: 'contentful',
      applicationId: process.env.ALGOLIA_APPLICATION_ID,
      apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      useSearchKey: false,
      thresholds: {
        totalRecords: {
          critical: process.env.NODE_ENV === 'production' ? 100 : 50,
          warning: process.env.NODE_ENV === 'production' ? 125 : 100
        },
        categories: {
          'In the News': {
            critical: 5,
            warning: 20,
            actualField: 'postType',
            actualValue: 'In the News'
          },
          'Blogs': {
            critical: 3,
            warning: 10,
            actualField: 'postType',
            actualValue: 'Blog Post'
          }
        }
      },
      skipHeavyFacets: false
    }),

    createPagesCheck({
      critical: [
        { path: '/', name: 'Homepage' },
        { path: '/about', name: 'About' }
      ],
      important: [{ path: '/blog', name: 'Blog Index' }],
      timeout: process.env.NODE_ENV === 'production' ? 5000 : 10000,
      retries: process.env.NODE_ENV === 'production' ? 3 : 1
    }),

    createHttpCheck({
      endpoints: [
        {
          path: '/api/graphql',
          method: 'POST',
          name: 'GraphQL API',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            query: `
              query HealthCheck {
                __typename
              }
            `
          }
        }
      ],
      timeout: 5000,
      retries: 2
    })
  ]
};

export default config;
