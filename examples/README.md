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
- `pages/api/healthcheck.ts` - API route implementation

### 2. Next.js App Router (`nextjs-app-router/`)
Example for Next.js App Router (Next.js 13+).

**Features:**
- App Router API routes
- Contentful integration
- Optimized for modern Next.js

**Files:**
- `healthcheck.config.ts` - Configuration
- `app/api/healthcheck/route.ts` - App Router API implementation

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
  sanitize: 'counts-only' // Prevents information leakage in production
};
```

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
