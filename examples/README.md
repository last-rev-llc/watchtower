# Watchtower Examples

This directory contains practical examples of how to integrate Watchtower into your Next.js applications.

## Available Examples

### 1. Next.js Pages Router (`nextjs-pages-router/`)
Complete example for Next.js Pages Router with Contentful and Algolia integration.

**Features:**
- Contentful site template
- Algolia search monitoring
- Custom page checks
- Production-ready configuration

**Files:**
- `healthcheck.config.ts` - Complete configuration
- `pages/api/healthcheck/[[...slug]].ts` - Optional catch-all route (supports test page)
- `pages/api/healthcheck.ts` - Simple route (alternative, no test page support)

### 2. Next.js App Router (`nextjs-app-router/`)
Example for Next.js App Router (Next.js 13+).

**Features:**
- App Router API routes
- Contentful integration
- Optimized for modern Next.js

**Files:**
- `healthcheck.config.ts` - Configuration
- `app/api/healthcheck/[[...slug]]/route.ts` - Optional catch-all route (supports test page)
- `app/api/healthcheck/route.ts` - Simple route (alternative, no test page support)

### 3. Manual Configuration (`manual-config/`)
Custom configuration example without using templates.

**Features:**
- Manual check configuration
- Custom API endpoint monitoring
- Database health checks
- Flexible setup

**Files:**
- `healthcheck.config.ts` - Manual configuration
- `pages/api/healthcheck.ts` - API route

### 4. Minimal Setup (`minimal/`)
Simple configuration with only essential checks.

**Features:**
- Build integrity monitoring
- Environment variable validation
- Minimal footprint

**Files:**
- `healthcheck.config.ts` - Minimal configuration
- `pages/api/healthcheck.ts` - API route

### 5. Datadog Synthetics (`datadog-synthetics/`)
Generic Datadog synthetic test definitions plus a reference sync script so you can keep synthetics in source control alongside your app.

**Features:**
- P1 Critical template — asserts `HTTP 200`, fires on full outage (HTTP 503)
- P2 High template — asserts `$.status is "Up"`, fires on degraded service (`Partial`)
- Dependency-free `sync.js` to create/update tests via Datadog API (Node 18+ built-in fetch)
- Ready-to-copy GitHub Actions example for path-scoped auto-sync on push to main

**Files:**
- `healthcheck-p1.json` - P1 Critical synthetic definition
- `healthcheck-p2.json` - P2 High synthetic definition
- `sync.js` - Reference sync script (copy into your repo / CI)
- `README.md` - First-time setup, placeholder substitution, CI integration guide

## Getting Started

1. **Choose an example** that matches your setup
2. **Copy the files** to your project
3. **Install dependencies:**
   ```bash
   npm install @last-rev/watchtower
   # or
   pnpm add @last-rev/watchtower
   ```
4. **Set up environment variables** (see below)
5. **Customize the configuration** for your needs
6. **Test the endpoint:**
   ```bash
   curl http://localhost:3000/api/healthcheck
   ```

## Environment Variables

Create a `.env.local` file in your project root with:

```env
# Required
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production

# Optional - Authentication
HEALTHCHECK_TOKEN=your-secret-token

# Optional - Algolia Search
ALGOLIA_INDEX=contentful
ALGOLIA_APPLICATION_ID=your-app-id
ALGOLIA_SEARCH_API_KEY=your-search-key

# Optional - Contentful
CONTENTFUL_SPACE_ID=your-space-id
CONTENTFUL_ENV=master
CONTENTFUL_DELIVERY_TOKEN=your-delivery-token

# Optional - Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Optional - Redis
REDIS_URL=redis://localhost:6379
```

## Customization

### Adding Custom Checks
You can extend any example by adding additional checks:

```typescript
import { createHttpCheck } from '@last-rev/watchtower';

const config = {
  checks: [
    // Add your custom checks here
    createHttpCheck({
      endpoints: [
        {
          path: '/api/custom-endpoint',
          name: 'Custom Service',
          expectedStatus: 200
        }
      ]
    })
  ]
};
```

### Security Configuration
For production, always configure authentication and sanitization:

```typescript
export default {
  // ... other config
  auth: {
    token: process.env.HEALTHCHECK_TOKEN
    // In production, auth is required by default
    // Query params disabled by default (use headers for better security)
  },
  sanitize: 'counts-only', // Prevents information leakage in production
  
  // Enable test page for browser-based testing (development only recommended)
  enableTestPage: process.env.NODE_ENV === 'development' ? true : false
};
```

### Test Page
When `enableTestPage` is enabled, access the interactive test page at:
- Default: `/api/healthcheck/test`
- Custom: `/api/healthcheck/your-custom-path` (if `enableTestPage: '/your-custom-path'`)

The test page provides:
- Secure token input (sessionStorage, not localStorage)
- Token sent via Authorization header (never in URL)
- Beautiful UI with formatted JSON output
- Token must be entered to run healthcheck (no bypass)
- Token validated against HEALTHCHECK_TOKEN environment variable

## Testing

### Development
```bash
npm run dev
curl http://localhost:3000/api/healthcheck
```

### Production
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/healthcheck
```

## Troubleshooting

**Common Issues:**
- Ensure all required environment variables are set
- Check that your Next.js version supports the API route structure
- Verify Algolia credentials and index accessibility
- Test in development mode first (`NODE_ENV=development`)

**Debug Mode:**
Set `sanitize: 'none'` in development to see detailed error messages.

## Support

For help with these examples:
- Check the main [README](../../README.md) for detailed documentation
- Review the [troubleshooting section](../../README.md#troubleshooting)
- Create an issue on [GitHub](https://github.com/last-rev-llc/watchtower/issues)
