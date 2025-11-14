# Publishing Guide for @last-rev/watchtower

This document outlines the secure publishing process for the Watchtower healthcheck package.

## 🔐 Security First

This is a **public npm package** - ensure no secrets or client-specific code is included:

### ✅ What's Safe to Publish:
- Generic source code (`src/`)
- Public examples (`examples/`)
- Documentation (`README.md`, `LICENSE`)
- Build artifacts (`dist/` - auto-generated)
- Package metadata (`package.json`)

### ❌ Never Committed (via `.gitignore`):
- Environment variables (`.env*`)
- Client-specific configurations
- API keys or tokens
- `node_modules/`
- Local development files

## 📦 Publishing Workflows

### Quick Commands (Added to package.json)

```bash
# Dry run - See what will be published (no actual publish)
pnpm run publish:dry-run

# Publish beta version for testing
pnpm run publish:beta

# Publish stable version
pnpm run publish:stable

# Version bump for beta
pnpm run version:beta

# Version bump for stable
pnpm run version:stable
```

## 🚀 Publishing Process

### Automated Workflow (Recommended)

**The GitHub Actions workflow handles versioning and releases automatically:**

```bash
# 1. Create a changeset describing changes
pnpm changeset add
# Select: patch/minor/major
# Describe: "Add new feature X"

# 2. Commit and push changeset
git add .changeset/
git commit -m "Add feature X"
git push

# 3. Create PR (changeset-bot will verify changeset exists)
# 4. Merge PR to main

# 5. GitHub Actions automatically:
#    ✅ Versions package (updates package.json)
#    ✅ Updates CHANGELOG.md
#    ✅ Commits version changes
#    ✅ Creates git tag (v0.5.0)
#    ✅ Creates GitHub release

# 6. Manually publish to npm when ready
pnpm publish:stable
```

### Manual Process (Alternative)

If you prefer to do everything manually:

```bash
# 1. Create a changeset
pnpm changeset add

# 2. Version the package
pnpm version-packages
# This updates package.json and CHANGELOG.md

# 3. Review changes
git diff package.json CHANGELOG.md

# 4. Commit version changes
git add .
git commit -m "chore: version 0.5.0"
git push

# 5. Create git tag
git tag v0.5.0
git push origin v0.5.0

# 6. Create GitHub release (or use GitHub CLI)
gh release create v0.5.0 --title "Release v0.5.0" \
  --notes "$(awk '/^## 0.5.0/,/^## /' CHANGELOG.md | sed '$d' | sed '1d')"

# 7. Publish to npm
pnpm publish:stable
```

### First Time Setup (One-time)

1. **Verify npm authentication:**
   ```bash
   npm whoami
   # Should show your npm username
   ```

2. **If not logged in:**
   ```bash
   npm login
   # Follow prompts (credentials stored in ~/.npmrc, NOT in repo)
```

## 🔍 Pre-Publish Checklist

Before publishing, always verify:

- [ ] `pnpm build` succeeds with no errors
- [ ] No `.env` files in project
- [ ] No client-specific code or references
- [ ] README.md is up to date
- [ ] Examples work and are generic
- [ ] Version number is correct in `package.json`
- [ ] CHANGELOG.md is updated (via changesets)
- [ ] All commits are pushed to GitHub

## 📊 Dry Run (Always Do This First!)

```bash
pnpm run publish:dry-run
```

This shows exactly what will be published **without actually publishing**. Review the output carefully:

```
npm notice 📦  @last-rev/watchtower@0.1.0
npm notice === Tarball Contents ===
npm notice 1.2kB  LICENSE
npm notice 15.3kB README.md
npm notice 2.1kB  package.json
npm notice 39.7kB dist/index.js
npm notice 12.2kB dist/adapters/next.js
npm notice ...   (more files)
```

Ensure you see **ONLY**:
- ✅ Source files (`src/`)
- ✅ Build artifacts (`dist/`)
- ✅ Documentation
- ✅ Examples
- ❌ NO `.env` files
- ❌ NO `node_modules/`
- ❌ NO client-specific code

## 🔄 Versioning Strategy

### Semantic Versioning (semver)

- **Major (1.0.0)** - Breaking changes
- **Minor (0.2.0)** - New features, backward compatible
- **Patch (0.1.1)** - Bug fixes

### Recommended Versions:

1. **Initial Beta:** `0.1.0-beta.0` → Test in 1-2 repos
2. **Second Beta:** `0.1.0-beta.1` → Test in 3-5 repos
3. **Release Candidate:** `0.1.0-rc.0` → Final testing
4. **First Stable:** `1.0.0` → Production ready
5. **Patches:** `1.0.1, 1.0.2` → Bug fixes
6. **Features:** `1.1.0, 1.2.0` → New checks/features

## 📝 Changesets Workflow

### Creating a Changeset

```bash
pnpm changeset add
```

You'll be prompted:
1. **What type of change?** (major/minor/patch)
2. **Summary:** Describe the changes

This creates a file in `.changeset/` that tracks the change.

### Automated Versioning (Recommended)

When you merge a PR with changesets to `main`, the GitHub Actions workflow automatically:
- Runs `pnpm version-packages` (which runs `changeset version`)
- Updates `package.json` version
- Updates `CHANGELOG.md` with your changeset content
- Removes the consumed changeset files
- Commits these changes
- Creates a git tag
- Creates a GitHub release

### Manual Versioning (Alternative)

If you want to version manually:

```bash
# Update version and generate CHANGELOG
pnpm version-packages
# or
pnpm changeset version

# This will:
# - Bump version in package.json
# - Update/create CHANGELOG.md
# - Remove consumed changeset files
```

## 🎯 Recommended Workflow

### Standard Release Process

```bash
# 1. Make your changes
git checkout -b feature/my-feature
# ... make changes ...

# 2. Create a changeset
pnpm changeset add
# → Select: patch/minor/major
# → Describe: "Add feature X" or "Fix bug Y"

# 3. Commit everything (including changeset)
git add .
git commit -m "Add feature X"
git push

# 4. Create PR
# The changeset-bot workflow will verify you have a changeset ✅

# 5. Merge PR to main
# GitHub Actions automatically:
#   - Versions the package
#   - Updates CHANGELOG.md
#   - Creates git tag
#   - Creates GitHub release

# 6. Publish to npm when ready
pnpm publish:stable
```

### Beta Release (For Testing)

If you want to publish a beta version for testing:

```bash
# 1. Create changeset
pnpm changeset add
# → Select: minor

# 2. Version to beta manually
pnpm version:beta
# This creates a snapshot version like 0.5.0-beta.0

# 3. Commit and push
git add .
git commit -m "chore: version 0.5.0-beta.0"
git push

# 4. Publish beta
pnpm publish:beta

# 5. Test in target project
cd /path/to/your/project
npm install @last-rev/watchtower@beta
```

## 🔒 Security Notes

### npm Credentials
- ✅ Stored in `~/.npmrc` (local only, never committed)
- ✅ Check with: `npm whoami` → Should show `you npm username`
- ✅ No need to add anything to this repo

### GitHub Actions (Current Setup)
We have automated workflows set up:
- **Version and Release Workflow** (`.github/workflows/publish.yml`):
  - Automatically versions packages when changesets are merged to main
  - Updates CHANGELOG.md automatically
  - Creates git tags
  - Creates GitHub releases
  - **Note:** npm publishing is done manually (see below)
- **Changeset Bot** (`.github/workflows/changeset-bot.yml`):
  - Enforces that PRs include changesets
  - Prevents merging without versioning information

### .gitignore Protection
Already configured to ignore:
- ✅ `.env*` - All environment files
- ✅ `node_modules/` - Dependencies
- ✅ `*.log` - Debug logs
- ✅ OS files - `.DS_Store`, etc.

## 📋 Post-Publish Verification

After publishing, verify:

```bash
# 1. Check npm registry
npm view @last-rev/watchtower

# 2. Verify version
npm view @last-rev/watchtower version

# 3. Check what files were published
npm view @last-rev/watchtower files

# 4. Test installation in fresh directory
mkdir /tmp/test-watchtower
cd /tmp/test-watchtower
npm init -y
npm install @last-rev/watchtower
```

## 🚨 Rollback (If Needed)

If you accidentally publish something wrong:

```bash
# Deprecate a version (doesn't unpublish, but warns users)
npm deprecate @last-rev/watchtower@0.1.0 "Please use 0.2.0 or higher"

# Unpublish (only works within 72 hours)
npm unpublish @last-rev/watchtower@0.1.0
```

## 📌 Quick Reference

| Action           | Command                         |
| ---------------- | ------------------------------- |
| Dry run          | `pnpm run publish:dry-run`      |
| Publish beta     | `pnpm run publish:beta`         |
| Publish stable   | `pnpm run publish:stable`       |
| Create changeset | `pnpm changeset`                |
| Version beta     | `pnpm run version:beta`         |
| Version stable   | `pnpm run version:stable`       |
| Check npm user   | `npm whoami`                    |
| View published   | `npm view @last-rev/watchtower` |

---

**Always run `publish:dry-run` first to verify what will be published!** 🛡️

