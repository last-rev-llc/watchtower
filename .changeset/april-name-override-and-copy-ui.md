---
"@last-rev/watchtower": minor
---

Add `name` config override and test page copy-to-clipboard functionality.

**New Feature: `RunnerConfig.name`**

Introduces an optional `name` field on `RunnerConfig` that allows consumers to
explicitly set a static display name for the healthcheck, rather than relying on
the dynamic value derived from the `SITE` environment variable or request hostname.

When provided:
- `response.name` becomes `"<name> Site Health"`
- `response.id` becomes `"<name_lowercased_and_underscored>_healthcheck"`

This is useful when the same deployed binary serves multiple named environments
or when the hostname-derived name is ambiguous.

```ts
// Before: name/id derived from hostname or SITE env var at runtime
createWatchtowerHandler({ checks })

// After: deterministic name/id regardless of environment
createWatchtowerHandler({ checks, name: 'Diligent Marketing' })
// → response.name: "Diligent Marketing Site Health"
// → response.id:   "diligent_marketing_healthcheck"
```

**Enhancement: Test Page Copy Button**

Adds a "📋 Copy" button to the JSON result panel on the `/api/healthcheck/test`
page. Supports the modern Clipboard API with a graceful `execCommand` fallback
for older browsers. Provides visual confirmation ("✅ Copied!") with a 2-second
reset. No breaking changes.
