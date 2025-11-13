/**
 * Example Next.js Pages Router Healthcheck Configuration
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
  budgetMs: 20000, // 8 second timeout for comprehensive checks
  cacheMs: 30000, // 30 second cache for development
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
    // Build integrity check
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
    }),

    // Algolia search check
    createAlgoliaCheck({
      indexName: 'contentful',
      applicationId: process.env.ALGOLIA_APPLICATION_ID,
      apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      useSearchKey: false, // Use admin key for comprehensive monitoring
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
          },
          'Press Releases': {
            critical: 1,
            warning: 5,
            actualField: 'postType',
            actualValue: 'Press Release'
          }
        }
      },
      skipHeavyFacets: false // Enable full facet checking
    }),

    // Page checks
    createPagesCheck({
      critical: [
        { path: '/', name: 'Homepage' },
        { path: '/newsroom', name: 'Newsroom' },
        { path: '/about', name: 'About' }
      ],
      important: [{ path: '/blog', name: 'Blog Index' }],
      timeout: process.env.NODE_ENV === 'production' ? 5000 : 10000,
      retries: process.env.NODE_ENV === 'production' ? 3 : 1
    }),

    // GraphQL API check
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
