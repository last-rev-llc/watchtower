# @last-rev/watchtower

## 0.4.3

### Patch Changes

- b30c4c9: No changes from v0.4.2, testing Github workflows.

## 0.4.2

### Patch Changes

- 33a0521: - Fix esbuild vulnerability by updating vitest from 2.1.9 to 4.0.9 (uses vite 7.2.2 with esbuild 0.27.0)
  - Add Next.js 16 support to peer dependencies
  - Fix GitHub Actions workflow: move GitHub CLI installation after changesets check
  - Make workflow branch creation retryable with force-with-lease for safer pushes
- 615bcc0: Fix test page button and Enter key functionality by removing TypeScript syntax from inline JavaScript that was causing "Unexpected identifier" error in browser console.

## 0.4.1

### Patch Changes

- Fix test page button and Enter key functionality by removing TypeScript syntax from inline JavaScript that was causing "Unexpected identifier" error in browser console.

## 0.4.0

### Minor Changes

- 🔒 Security Release - Major security improvements to prevent information leakage and unauthorized access

  **Breaking Changes:**

  - Auth now required by default in production environments
  - `allowMonitoring` option removed (use token-based authentication instead)
  - Query parameter tokens disabled by default (use headers for better security)

  **New Features:**

  - Enhanced auth configuration options (`requireAuth`, `allowQueryToken`, `strictMode`, `onAuthFailure`)
  - Minimal error responses to prevent information leakage
  - Security headers on all responses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
  - Constant-time token comparison to prevent timing attacks
  - Interactive test page (`enableTestPage`) for secure browser-based testing

  **Security Fixes:**

  - Fixed XSS vulnerabilities (replaced all `innerHTML` with safe DOM methods)
  - Auth validation now happens before any healthcheck processing to prevent information leakage
  - Status values sanitized for CSS class names

  **Migration:** Remove `allowMonitoring` from your config. Auth is now required in production by default. Monitoring tools should use `Authorization: Bearer <token>` header.

## 0.3.0

### Minor Changes

- 🔒 Security Release - Major security improvements to prevent information leakage and unauthorized access

  **Breaking Changes:**

  - Auth now required by default in production environments
  - `allowMonitoring` option removed (use token-based authentication instead)
  - Query parameter tokens disabled by default (use headers for better security)

  **New Features:**

  - Enhanced auth configuration options (`requireAuth`, `allowQueryToken`, `strictMode`, `onAuthFailure`)
  - Minimal error responses to prevent information leakage
  - Security headers on all responses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
  - Constant-time token comparison to prevent timing attacks

  **Migration:** Remove `allowMonitoring` from your config. Auth is now required in production by default. Monitoring tools should use `Authorization: Bearer <token>` header.

## 0.2.2

### Patch Changes

- Fix Algolia v5 API - use searchSingleIndex correctly
