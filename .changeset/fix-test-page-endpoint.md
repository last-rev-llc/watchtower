---
'@last-rev/watchtower': patch
---

**Bug Fix**: Fix test page healthcheck endpoint to use absolute paths

Fixed a regression introduced in v0.4.7 where the test page would generate relative URLs instead of absolute paths, causing 404 errors.

**Problem:**
- Test page served at `/api/healthcheck/test` would fetch `api/healthcheck` (relative)
- Browser would resolve to `/api/healthcheck/api/healthcheck` → 404

**Solution:**
- Preserve leading slash in `getHealthcheckEndpoint()` 
- Only strip trailing slashes, keeping absolute path format
- Test page now correctly fetches `/api/healthcheck` (absolute)

**Impact:**
- ✅ Fixes test page functionality broken in v0.4.7
- ✅ No breaking changes
- ✅ Maintains security improvements from v0.4.7

Credit: Issue identified by Codex automated review on PR #20

