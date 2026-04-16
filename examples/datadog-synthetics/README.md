# Datadog Synthetics Examples

Source-controlled Datadog synthetic test definitions for monitoring a Watchtower-powered `/api/healthcheck` endpoint, plus a reference sync script to keep Datadog in sync with these files.

## Why synthetics for Watchtower

Watchtower aggregates every sub-check (pages, GraphQL, build integrity, custom HTTP checks) server-side. The `/api/healthcheck` endpoint returns:

| Watchtower status | HTTP | Meaning |
|---|---|---|
| `Up` | 200 | All systems operational |
| `Partial` | 200 | Some services degraded but site functional |
| `Down` | 503 | Critical services unavailable |
| `Unknown` | 503 | Check results inconclusive |

A single external probe covers everything. Two synthetic tests split the alerting by severity:

## P1 vs P2 pattern

| | P1 Critical | P2 High |
|---|---|---|
| **Assertion** | `statusCode is 200` only | `statusCode 200` + `$.status is "Up"` + `content-type` |
| **Fires when** | HTTP 503 (Down / Unknown) | HTTP 200 but `$.status != "Up"` (Partial) |
| **Default tick** | Every 1 min | Every 5 min |
| **Priority** | P1 Critical | P2 High |
| **File** | [`healthcheck-p1.json`](./healthcheck-p1.json) | [`healthcheck-p2.json`](./healthcheck-p2.json) |

When the site is fully Down, only P1 fires. When it's Partial, only P2 fires. No conflicting alerts.

## First-time setup

1. **Copy** the two JSON files into your project (e.g. `monitoring/synthetics/`)
2. **Substitute placeholders** in both files:
   - `{{SITE_NAME}}` → human-readable site name (e.g. `Diligent Marketing`)
   - `{{SITE_TAG}}` → Datadog tag slug (e.g. `diligent-marketing`)
   - `{{SITE_URL}}` → your production URL (e.g. `https://www.diligent.com`)
3. **Leave `{{HEALTHCHECK_TOKEN}}` as-is** — Datadog resolves it at runtime from a global variable
4. **Create a secure Datadog global variable** named `HEALTHCHECK_TOKEN` at
   [Datadog → Synthetics → Settings → Global Variables](https://app.datadoghq.com/synthetics/settings/variables)
   - Set the value to your production `HEALTHCHECK_TOKEN` env var
   - Mark it as secure so the value is encrypted
5. **Run the sync** to create the tests in Datadog (see below)
6. On first run, `sync.js` writes the returned `public_id` back into each JSON file — commit these changes

## Running the sync

### Locally

```bash
export DATADOG_API_KEY=<your api key>
export DATADOG_APP_KEY=<your application key>

node sync.js /path/to/monitoring/synthetics
```

### In CI

The script is dependency-free (uses Node 18+ built-in `fetch`) and safe to run on every push. Example GitHub Action:

```yaml
name: Sync Datadog Synthetics
on:
  push:
    branches: [main]
    paths:
      - 'monitoring/synthetics/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write  # to commit new public_ids back
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node monitoring/scripts/sync.js monitoring/synthetics
        env:
          DATADOG_API_KEY: ${{ secrets.DATADOG_API_KEY }}
          DATADOG_APP_KEY: ${{ secrets.DATADOG_APP_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore(monitoring): sync Datadog synthetic public_ids'
          file_pattern: 'monitoring/synthetics/*.json'
```

## Script behaviour

| Condition | Action |
|---|---|
| JSON has `public_id` field | `PUT /api/v1/synthetics/tests/{public_id}` — update in place |
| JSON has no `public_id` field | `POST /api/v1/synthetics/tests` — create and write `public_id` back |
| API returns non-2xx | Print error, continue other files, exit 1 at end |

### Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `DATADOG_API_KEY` | yes | — | Datadog API key |
| `DATADOG_APP_KEY` | yes | — | Datadog Application key |
| `DATADOG_SITE` | no | `datadoghq.com` | For EU/Gov sites, e.g. `datadoghq.eu` |

## Notification handles

The templates use generic Slack / Jira handles:

```
@slack-uptime-monitoring @jira-support-issue
```

Replace these with your team's actual notification targets in each JSON file's `message` field.

## See also

- [`DATADOG_MONITORING.md`](../../DATADOG_MONITORING.md) — deeper guide covering custom metrics, multi-test splits, Terraform, and dashboards
- [Datadog Synthetics API reference](https://docs.datadoghq.com/api/latest/synthetics/)
- [Datadog global variables docs](https://docs.datadoghq.com/synthetics/settings/?tab=specifyvalue#global-variables)
