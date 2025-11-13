# @last-rev/watchtower

A unified healthcheck and status toolkit for web applications — Watchtower keeps a vigilant eye on your site's heartbeat, ensuring every critical path and service stays up.

[![npm version](https://badge.fury.io/js/%40last-rev%2Fwatchtower.svg)](https://badge.fury.io/js/%40last-rev%2Fwatchtower)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🏥 **Comprehensive Health Checks** - Monitor Algolia search, web pages, HTTP endpoints, and build integrity
- ⚡ **High Performance** - Parallel execution with configurable timeouts and caching
- 🔒 **Security First** - Multiple sanitization strategies for production environments
- 🔧 **Framework Agnostic** - Next.js adapter included, Express support coming soon
- 📦 **Zero Runtime Dependencies** - Lightweight package with peer dependencies only
- 🎯 **TypeScript Ready** - Full TypeScript support with comprehensive type definitions

## Installation

```bash
# npm
npm install @last-rev/watchtower

# pnpm
pnpm add @last-rev/watchtower

# yarn
yarn add @last-rev/watchtower
```

**Peer Dependencies:**
- `algoliasearch@^5.0.0` (required for Algolia checks)
- `next@^12.0.0 || ^13.0.0 || ^14.0.0 || ^15.0.0` (required for Next.js adapter)

## Examples

Ready-to-use examples are available in the [`examples/`](./examples/) directory:

- **[Next.js Pages Router](./examples/nextjs-pages-router/)** - Complete setup with Contentful and Algolia
- **[Next.js App Router](./examples/nextjs-app-router/)** - Modern Next.js 13+ App Router integration
- **[Manual Configuration](./examples/manual-config/)** - Custom configuration without templates
- **[Minimal Setup](./examples/minimal/)** - Simple configuration with essential checks only

See the [examples README](./examples/README.md) for detailed setup instructions.

## Quick Start

### Next.js Setup

1. **Create your healthcheck configuration:**

```typescript
// healthcheck.config.ts
import {
  createAlgoliaCheck,
  createPagesCheck,
  createBuildCheck,
  type RunnerConfig
} from '@last-rev/watchtower';

const config: RunnerConfig = {
  budgetMs: 20000,
  cacheMs: 30000,
  auth: {
    token: process.env.HEALTHCHECK_TOKEN
    // In production, auth is required by default
    // Query params disabled by default (use headers for better security)
  },
  sanitize: process.env.NODE_ENV === 'production' ? 'counts-only' : 'none',
  
  checks: [
    createBuildCheck({
      criticalEnv: ['CONTENTFUL_SPACE_ID', 'ALGOLIA_ADMIN_API_KEY']
    }),
    createAlgoliaCheck({
      indexName: 'contentful',
      apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      useSearchKey: false,
      thresholds: {
        totalRecords: { critical: 50, warning: 100 },
        categories: {
          'In the News': {
            critical: 5,
            warning: 20,
            actualField: 'postType',
            actualValue: 'In the News'
          }
        }
      }
    }),
    createPagesCheck({
      critical: [{ path: '/', name: 'Homepage' }],
      timeout: 5000,
      retries: 2
    })
  ]
};

export default config;
```

2. **Create your API route:**

```typescript
// pages/api/healthcheck.ts
import { createNextHandler } from '@last-rev/watchtower';
import config from '../../healthcheck.config';

export default createNextHandler(config);
```

3. **Test your healthcheck:**

```bash
# Development
curl http://localhost:3000/api/healthcheck

# Production (with authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" https://example.com/api/healthcheck
```

### Using Templates (Alternative Approach)

For quick setup, you can use pre-configured templates:

```typescript
// healthcheck.config.ts
import { contentfulSiteTemplate } from '@last-rev/watchtower';

export default contentfulSiteTemplate({
  algolia: {
    indexName: 'contentful',
    thresholds: {
      totalRecords: { critical: 50, warning: 100 }
    }
  }
});
```

Then use it in your API route:

```typescript
// pages/api/healthcheck.ts
import { createNextHandler } from '@last-rev/watchtower';
import config from '../../healthcheck.config';

export default createNextHandler(config);
```

## Configuration

### Available Checks

#### Algolia Check
Monitor your Algolia search indices with customizable thresholds.

```typescript
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
    },
  },
  skipHeavyFacets: false, // Enable full facet checking for comprehensive monitoring
});
```

#### Pages Check
Verify critical web pages are accessible and responding correctly.

```typescript
createPagesCheck({
  critical: [
    { path: '/', name: 'Homepage' },
    { path: '/robots.txt', name: 'Robots.txt' },
    { path: '/sitemap.xml', name: 'Sitemap' },
  ],
  important: [
    { path: '/about', name: 'About Page' },
    { path: '/blog', name: 'Blog Index' },
  ],
  timeout: 5000,
  retries: 2,
});
```

#### HTTP Check
Test custom HTTP endpoints with full control over requests.

```typescript
createHttpCheck({
  endpoints: [
    {
      path: '/api/graphql',
      name: 'GraphQL API',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { query: '{ __typename }' },
      expectedStatus: 200,
    },
  ],
  timeout: 3000,
  retries: 1,
});
```

#### Build Check
Validate build integrity and environment variables.

```typescript
createBuildCheck({
  criticalEnv: [
    'CONTENTFUL_SPACE_ID',
    'CONTENTFUL_DELIVERY_TOKEN',
    'NODE_ENV',
  ],
  optionalEnv: [
    'NEXT_PUBLIC_SITE_URL',
    'ALGOLIA_APPLICATION_ID',
  ],
});
```

### Templates

Watchtower provides pre-configured templates for common use cases:

#### Contentful Site Template
Optimized for Contentful-powered websites with Algolia search.

```typescript
import { contentfulSiteTemplate } from '@last-rev/watchtower';

export default contentfulSiteTemplate({
  algolia: {
    indexName: 'contentful',
    thresholds: {
      totalRecords: { critical: 100, warning: 200 },
      categories: {
        'Blog Posts': { 
          critical: 5, 
          warning: 20,
          actualField: 'contentType',
          actualValue: 'blogPost'
        },
      },
    },
  },
  // Optional: Don't pass contentful config to avoid API checks
  // contentful: { ... }
});
```

**Note:** The `contentfulSiteTemplate` includes Build integrity and Algolia checks. To add Contentful API checks, pass the `contentful` configuration option.

#### Default Template
A balanced configuration suitable for most web applications. No configuration needed.

```typescript
import { defaultTemplate } from '@last-rev/watchtower';

// Returns config with:
// - Pages check (/, /robots.txt, /sitemap.xml, /favicon.ico)
// - Build check (NODE_ENV, NEXT_PUBLIC_SITE_URL)
export default defaultTemplate();
```

#### Minimal Template
Lightweight setup with only essential checks. No configuration needed.

```typescript
import { minimalTemplate } from '@last-rev/watchtower';

// Returns config with:
// - Build check (package.json, Node version)
export default minimalTemplate();
```

### Authentication

Secure your healthcheck endpoints with token-based authentication. In production, authentication is **required by default** to prevent information leakage.

```typescript
const config = {
  // ... checks
  auth: {
    token: process.env.HEALTHCHECK_TOKEN,
    // In production, auth is required by default
    // Query params disabled by default (use headers for better security)
    // allowQueryToken: false, // Enable for browser testing (not recommended for production)
    // strictMode: true, // Minimal error responses (default: true in production)
    customValidator: (req) => {
      // Custom validation logic (takes precedence over token)
      return req.headers['x-internal-token'] === process.env.INTERNAL_TOKEN;
    },
    onAuthFailure: (req, reason) => {
      // Optional callback for logging/alerting
      console.warn('Healthcheck auth failed:', reason);
    },
  },
};
```

**Token can be provided via:**
- `Authorization: Bearer <token>` header (recommended, works with monitoring tools)
- `X-Healthcheck-Token: <token>` header
- Query parameter `?token=<token>` (if `allowQueryToken: true` is enabled)

**Security defaults:**
- Production: Auth **required** by default
- Query params: **Disabled** by default (can appear in logs)
- Strict mode: **Enabled** in production (minimal error responses)

### Sanitization Strategies

Control what information is exposed in healthcheck responses:

#### None (Development)
```typescript
sanitize: 'none' // Full details exposed
```

#### Redact Values (Internal Monitoring)
```typescript
sanitize: 'redact-values' // Environment variables and URLs partially masked
```

#### Counts Only (Production)
```typescript
sanitize: 'counts-only' // Only show counts, no sensitive details
```

## Performance

### Budget and Timeouts
Configure performance constraints to ensure healthchecks don't impact your application:

```typescript
const config = {
  budgetMs: 20000,    // Global timeout (8 seconds for comprehensive checks)
  cacheMs: 30000,    // Cache results for 30 seconds (balance between freshness and performance)
  aggregationPrecedence: ['Down', 'Partial', 'Unknown', 'Up'],
};
```

### Caching
Expensive operations like Algolia facet queries are automatically cached:

```typescript
const config: RunnerConfig = {
  cacheMs: 30000, // Cache results for 30 seconds
  checks: [
    createAlgoliaCheck({
      indexName: 'contentful',
      skipHeavyFacets: false // Enable full facet checking (cached)
    })
  ]
};
```

## Response Format

Healthcheck responses follow a standardized format:

```json
{
  "id": "site_healthcheck",
  "name": "Site Health",
  "status": "Up",
  "message": "All systems operational",
  "timestamp": 1703123456789,
  "performance": {
    "totalCheckTime": 234,
    "checksCompleted": 4,
    "checksFailed": 0
  },
  "services": [
    {
      "id": "algolia",
      "name": "Algolia Search",
      "status": "Up",
      "message": "Algolia Search: All systems operational",
      "timestamp": 1703123456789,
      "services": [
        {
          "id": "record_count",
          "name": "Record Count",
          "status": "Up",
          "message": "1250 total records (234ms)",
          "timestamp": 1703123456789,
          "metadata": {
            "duration": 234,
            "totalRecords": 1250,
            "productionRecords": 1100,
            "previewRecords": 150
          }
        }
      ]
    }
  ]
}
```

## HTTP Status Codes

The API returns appropriate HTTP status codes based on overall health:

- `200` - Up or Partial (service still functional)
- `503` - Down or Unknown (service unavailable)

## Environment Variables

### Required for Functionality
- `NEXT_PUBLIC_SITE_URL` - Base URL for page checks (e.g., `https://example.com`)
- `ALGOLIA_APPLICATION_ID` - Algolia application ID
- `ALGOLIA_ADMIN_API_KEY` - Algolia admin API key (recommended for comprehensive monitoring)
- `CONTENTFUL_SPACE_ID` - Contentful space ID
- `CONTENTFUL_ENV` - Contentful environment (e.g., `master`)

### Security
- `HEALTHCHECK_TOKEN` - Authentication token for healthcheck endpoint (required in production)
- `NODE_ENV` - Environment mode (affects sanitization and thresholds)

### Optional
- `ALGOLIA_SEARCH_API_KEY` - Algolia search-only API key (alternative to admin key)
- `CONTENTFUL_DELIVERY_TOKEN` - Contentful delivery API token
- `CONTENTFUL_PREVIEW_TOKEN` - Contentful preview API token
- `SITE_URL` - Alternative site URL configuration
- `DOMAIN` - Domain name for URL construction
- `VERCEL_URL` - Vercel deployment URL (auto-detected)
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string

## Advanced Usage

### Custom Check Implementation

Create your own health checks by implementing the `Check` interface:

```typescript
import type { Check, StatusNode } from '@last-rev/watchtower';
import { createStatusNode } from '@last-rev/watchtower';

export function createCustomCheck(): Check {
  return {
    id: 'custom',
    name: 'Custom Service',
    async run(): Promise<StatusNode> {
      try {
        // Your custom health check logic
        const isHealthy = await checkCustomService();

        return createStatusNode(
          'custom',
          'Custom Service',
          isHealthy ? 'Up' : 'Down',
          isHealthy ? 'Service operational' : 'Service unavailable'
        );
      } catch (error) {
        return createStatusNode(
          'custom',
          'Custom Service',
          'Unknown',
          `Check failed: ${(error as Error).message}`
        );
      }
    },
  };
}
```

### Framework Integration

#### Next.js (Pages Router)
```typescript
// pages/api/healthcheck.ts
import { createNextHandler } from '@last-rev/watchtower';

export default createNextHandler(config);
```

#### Next.js (App Router)
```typescript
// app/api/healthcheck/route.ts
import { createNextHandler } from '@last-rev/watchtower';

export const GET = createNextHandler(config);
```

## Migration from Legacy Healthchecks

### From Custom Implementation
1. Replace your existing healthcheck with Watchtower configuration
2. Update environment variables to match Watchtower expectations
3. Test thoroughly in development before deploying
4. Update monitoring dashboards to handle new response format

### Environment Variable Mapping
| Legacy            | Watchtower               |
| ----------------- | ------------------------ |
| `SITE_URL`        | `NEXT_PUBLIC_SITE_URL`   |
| `ALGOLIA_APP_ID`  | `ALGOLIA_APPLICATION_ID` |
| `ALGOLIA_API_KEY` | `ALGOLIA_ADMIN_API_KEY`  |

## Troubleshooting

### Common Issues

**Healthcheck returns 503 but site works fine**
- Check authentication configuration
- Verify all required environment variables are set
- Review individual service status in response details

**Algolia checks failing**
- Verify Algolia credentials and permissions
- Check if index exists and is populated
- Review network connectivity to Algolia API

**Page checks failing**
- Ensure `NEXT_PUBLIC_SITE_URL` is correctly set
- Check if pages actually exist at specified paths
- Verify site is accessible from healthcheck location

**Build failing**
- Check TypeScript compilation errors
- Verify all peer dependencies are installed
- Review build configuration in `tsup.config.ts`

### Debug Mode
Enable detailed logging in development:

```typescript
const config = {
  // ... configuration
  sanitize: 'none', // Show full details in development
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Checks
1. Create new check in `src/checks/`
2. Add exports to `src/checks/index.ts`
3. Update types in `src/core/types.ts`
4. Add documentation and examples
5. Update tests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Publishing

For maintainers publishing new versions, see [PUBLISHING.md](./PUBLISHING.md) for the complete publishing workflow.

## Support

For support and questions:
- 📧 [Create an issue](https://github.com/last-rev-llc/watchtower/issues)
- 📚 [Documentation](https://github.com/last-rev-llc/watchtower#readme)
- 🏢 [LastRev](https://lastrev.com)

---

**Made with ❤️ by [LastRev](https://lastrev.com)**
