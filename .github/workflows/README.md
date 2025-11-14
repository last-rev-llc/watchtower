# GitHub Actions Workflows

This directory contains automated workflows for maintaining the Watchtower repository.

## Workflows

### `publish.yml` (Version and Create PR)
**Triggers:** Push to `main` branch

**What it does:**
- Checks for changeset files in `.changeset/` directory
- If changesets found:
  - Runs `changeset version` (updates package.json and CHANGELOG.md)
  - Creates a version branch (`chore/version-vX.Y.Z`)
  - Creates a pull request for the version bump
- If no changesets found: Skips versioning
- Skips if commit message contains "Version packages for release" (prevents loops)

**Note:** This workflow does NOT publish to npm automatically. You'll need to publish manually after the release is created.

**Requirements:**
- GitHub Actions must have write permissions (default)
- GitHub CLI is installed automatically in the workflow

**Usage:**
1. Create a changeset: `pnpm changeset add`
2. Commit and push changeset file
3. Merge PR to main
4. Workflow automatically:
   - Versions the package
   - Updates CHANGELOG.md
   - Creates version PR
5. Merge the version PR
6. `create-tag.yml` workflow creates the git tag
7. `release.yml` workflow creates the GitHub release
8. Manually publish to npm: `pnpm publish:stable` (or `npm publish`)

### `changeset-bot.yml`
**Triggers:** Pull requests (opened, updated, closed)

**What it does:**
- Checks if PR has a changeset file
- Fails the check if no changeset is found
- Ensures all PRs include versioning information
- Automatically skips version PRs (they don't need changesets)

**Purpose:** Enforces that all PRs include changesets for proper versioning (except version PRs)

### `create-tag.yml` (Create Release Tag)
**Triggers:** When a version PR (`chore/version-v*`) is merged to `main`

**What it does:**
- Extracts version from the merged PR branch name
- Creates and pushes a git tag (`vX.Y.Z`)
- Triggers the `release.yml` workflow

**Purpose:** Automatically creates tags when version PRs are merged

### `release.yml` (Create GitHub Release)
**Triggers:** When a tag matching `v*` is pushed

**What it does:**
- Extracts version from tag
- Extracts release notes from CHANGELOG.md
- Creates a GitHub release with release notes

**Purpose:** Creates GitHub releases automatically when tags are pushed

### `sync-metadata.yml`
**Triggers:** Push to `main` when `package.json` changes, or manual trigger

**What it does:**
- Extracts description and keywords from `package.json`
- Automatically updates repository description and topics via GitHub API

**Purpose:** Keeps repository metadata in sync with package.json

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

### `codeql.yml` (Security Analysis)
**Triggers:** Push to `main`, pull requests, and weekly schedule

**What it does:**
- Runs CodeQL security analysis on TypeScript and JavaScript code
- Detects security vulnerabilities and coding issues
- Reports findings to GitHub Security tab

**Purpose:** Automated security scanning

## Manual Release Process

If you need to create a release manually (not recommended, use workflows instead):

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

