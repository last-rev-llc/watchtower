---
"@last-rev/watchtower": patch
---

Fix security vulnerabilities and update dev dependencies:
- Update @changesets/cli from 2.29.7 to 2.29.8 (fixes js-yaml prototype pollution GHSA-mh29-5h37-fv8m)
- Add pnpm override for glob >=10.5.0 (fixes command injection GHSA-5j98-mcp5-4vw2)
- Update vitest from 4.0.10 to 4.0.14 (supersedes Dependabot PR #17)

