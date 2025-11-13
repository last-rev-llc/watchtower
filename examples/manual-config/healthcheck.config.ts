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
  budgetMs: 20000,
  cacheMs: 30000,
  aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],

  // Security settings
  // Token-based authentication protects the endpoint from unauthorized access
  // In production, auth is required by default
  auth: {
    token: process.env.HEALTHCHECK_TOKEN
    // Query params disabled by default (use headers instead for better security)
    // To enable query params for browser testing: allowQueryToken: true
    // allowQueryToken: false,
    // Strict mode enabled in production (minimal error responses)
    // strictMode: true,
  },
  sanitize: process.env.NODE_ENV === 'production' ? 'counts-only' : 'none',

  // Enable interactive test page for browser-based testing
  // Access at /api/healthcheck/test (or custom path if specified)
  // Test page is secure: token stored in sessionStorage, sent via headers only
  enableTestPage: process.env.NODE_ENV === 'development' ? true : false,

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
