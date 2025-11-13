# @last-rev/watchtower

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
