/**
 * Example Manual Healthcheck Configuration
 * Custom configuration showing full flexibility and control
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
  budgetMs: 8000,
  cacheMs: 30000,
  aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],

  // Security settings
  auth: {
    token: process.env.HEALTHCHECK_TOKEN,
    allowMonitoring: true
  },
  sanitize: process.env.NODE_ENV === 'production' ? 'counts-only' : 'none',

  // Health checks
  checks: [
    createBuildCheck({
      criticalEnv: ['NODE_ENV', 'DATABASE_URL', 'CONTENTFUL_SPACE_ID', 'CONTENTFUL_DELIVERY_TOKEN'],
      optionalEnv: ['NEXT_PUBLIC_SITE_URL', 'ALGOLIA_APPLICATION_ID', 'REDIS_URL']
    }),

    createAlgoliaCheck({
      indexName: 'contentful',
      applicationId: process.env.ALGOLIA_APPLICATION_ID,
      apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      useSearchKey: false,
      thresholds: {
        totalRecords: {
          critical: 50,
          warning: 100
        },
        categories: {
          'Blog Posts': {
            critical: 5,
            warning: 20,
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
        { path: '/robots.txt', name: 'Robots.txt' },
        { path: '/sitemap.xml', name: 'Sitemap' },
        { path: '/favicon.ico', name: 'Favicon' }
      ],
      important: [
        { path: '/about', name: 'About Page' },
        { path: '/blog', name: 'Blog Index' },
        { path: '/contact', name: 'Contact Page' }
      ],
      timeout: 5000,
      retries: 2
    }),

    createHttpCheck({
      endpoints: [
        {
          path: '/api/graphql',
          name: 'GraphQL API',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            query: `
              query HealthCheck {
                __typename
              }
            `
          },
          expectedStatus: 200
        },
        {
          path: '/api/health/database',
          name: 'Database Health',
          method: 'GET',
          expectedStatus: 200
        }
      ],
      timeout: 3000,
      retries: 1
    })
  ]
};

export default config;
