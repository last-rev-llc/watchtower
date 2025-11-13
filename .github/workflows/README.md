# GitHub Actions Workflows

This directory contains automated workflows for maintaining the Watchtower repository.

## Workflows

### `publish.yml` (Version and Create Release)
**Triggers:** Push to `main` branch

**What it does:**
- Checks for changeset files in `.changeset/` directory
- If changesets found:
  - Runs `changeset version` (updates package.json and CHANGELOG.md)
  - Commits version changes
  - Creates a git tag
  - Creates a GitHub release with notes from CHANGELOG.md
- If no changesets found: Skips versioning and release creation

**Note:** This workflow does NOT publish to npm automatically. You'll need to publish manually after the release is created.

**Requirements:**
- GitHub Actions must have write permissions (default)

**Usage:**
1. Create a changeset: `pnpm changeset add`
2. Commit and push changeset file
3. Merge PR to main
4. Workflow automatically:
   - Versions the package
   - Updates CHANGELOG.md
   - Creates git tag
   - Creates GitHub release
5. Manually publish to npm: `pnpm publish:stable` (or `npm publish`)

### `changeset-bot.yml`
**Triggers:** Pull requests (opened, updated, closed)

**What it does:**
- Checks if PR has a changeset file
- Fails the check if no changeset is found
- Ensures all PRs include versioning information

**Purpose:** Enforces that all PRs include changesets for proper versioning

### `release.yml`
**Triggers:** When a tag matching `v*` is pushed

**What it does:**
- Extracts version from tag
- Extracts release notes from CHANGELOG.md
- Creates a GitHub release

**Usage:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

### `sync-metadata.yml`
**Triggers:** Push to `main` when `package.json` changes, or manual trigger

**What it does:**
- Extracts description and keywords from `package.json`
- Logs what should be updated (manual update required or use GitHub CLI)

**Manual update with GitHub CLI:**
```bash
gh repo edit last-rev-llc/watchtower \
  --description "A unified healthcheck and status toolkit..." \
  --add-topic healthcheck,monitoring,status,uptime,observability
```

## Setup

1. **Add NPM_TOKEN secret:**
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` with your npm access token

2. **Enable GitHub Actions:**
   - Go to repository Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

3. **Set up GitHub CLI (optional, for manual releases):**
   ```bash
   brew install gh
   gh auth login
   ```

## Manual Release Process

If you publish manually to npm, you can create a GitHub release:

```bash
# After publishing to npm
./scripts/create-release.sh
```

Or use GitHub CLI directly:
```bash
VERSION=$(node -p "require('./package.json').version")
gh release create "v$VERSION" \
  --title "Release v$VERSION" \
  --notes-file <(awk "/^## $VERSION/,/^## /" CHANGELOG.md | sed '$d' | sed '1d')
```

