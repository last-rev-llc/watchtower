---
'@last-rev/watchtower': patch
---

**Security Fix**: Resolve all open security vulnerabilities

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
