---
'@last-rev/watchtower': patch
---

**Security Fix**: Resolve ReDoS vulnerabilities in path normalization

Fixed three high-severity Regular Expression Denial of Service (ReDoS) vulnerabilities in `src/adapters/next.ts`. The vulnerable regex pattern `/^\/+|\/+$/g` has been replaced with a safe, non-backtracking string manipulation function `normalizePathSlashes()` that eliminates the risk of exponential time complexity attacks.

**Changes:**
- Added secure helper function `normalizePathSlashes()` to safely remove leading/trailing slashes
- Replaced all instances of vulnerable regex in path normalization (lines 37, 43, 63, 67)
- Maintained identical functionality with improved performance and security

**Impact:**
- Eliminates potential DoS attack vector through malicious path strings
- No breaking changes - all existing functionality preserved
- Improved performance through direct string manipulation vs regex

This resolves GitHub Security Scanning Alerts #2, #3, and #4.
