---
"@last-rev/watchtower": patch
---

Bump five dev dependencies to their latest non-major versions. No runtime or public API changes.

- `@changesets/cli` 2.29.8 → 2.30.0
- `@types/node` 25.0.0 → 25.6.0
- `@typescript-eslint/eslint-plugin` 8.49.0 → 8.58.2
- `@typescript-eslint/parser` 8.49.0 → 8.58.2
- `vitest` 4.0.15 → 4.1.4

The remaining updates proposed by Dependabot (`eslint` 9 → 10 and `typescript` 5 → 6) are held back as deliberate major-upgrade projects, since both have consumer-facing implications (ESLint 10 flat config changes, TypeScript 6 `.d.ts` emit).
