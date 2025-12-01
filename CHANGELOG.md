# @last-rev/watchtower

## 0.4.7

### Patch Changes

- 35953e3: **Security Fix**: Resolve all open security vulnerabilities

  Fixed three high-severity ReDoS vulnerabilities and one medium-severity workflow permissions issue.

  **ReDoS Vulnerabilities (Alerts #2, #3, #4 - HIGH):**

  - Fixed Regular Expression Denial of Service vulnerabilities in `src/adapters/next.ts`
  - Replaced vulnerable regex pattern `/^\/+|\/+$/g` with safe `normalizePathSlashes()` function
  - Eliminated exponential time complexity attack vector through malicious path strings
  - Added secure helper function using linear-time string manipulation
  - Replaced all instances in path normalization (lines 37, 43, 63, 67)

  **Workflow Permissions (Alert #5 - MEDIUM):**

  - Added explicit permissions to `.github/workflows/changeset-bot.yml`
  - Applied principle of least privilege with `contents: read` and `pull-requests: read`
  - Prevents overly permissive default GitHub Actions access

  **Impact:**

  - ✅ All 4 open security alerts resolved
  - ✅ No breaking changes - all existing functionality preserved
  - ✅ Improved security posture and performance

## 0.4.6

### Patch Changes

- a911d73: Fix security vulnerabilities and update dev dependencies:
  - Update @changesets/cli from 2.29.7 to 2.29.8 (fixes js-yaml prototype pollution GHSA-mh29-5h37-fv8m)
  - Add pnpm override for glob >=10.5.0 (fixes command injection GHSA-5j98-mcp5-4vw2)
  - Update vitest from 4.0.10 to 4.0.14 (supersedes Dependabot PR #17)

## 0.4.5

### Patch Changes

- d105848: Enhance workflows: trigger release workflow on tag creation and add workflow_dispatch event to release.yml

## 0.4.4

### Patch Changes

- a387871: fix: update sync-metadata workflow to use toJson for outputs

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
