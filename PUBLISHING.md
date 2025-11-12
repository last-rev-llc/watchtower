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

### Beta Release (Recommended for Initial Testing)

**Use this for testing in multiple repos before stable release:**

```bash
# 1. Create a changeset describing changes
pnpm changeset
# Select: minor (0.1.0 → 0.2.0-beta.0)
# Describe: "Initial beta release with Algolia, Pages, HTTP, and Build checks"

# 2. Version the package
pnpm run version:beta

# 3. Review changes
git diff package.json CHANGELOG.md

# 4. Commit version changes
git add .
git commit -m "chore: version 0.2.0-beta.0"

# 5. Publish to beta tag
pnpm run publish:beta

# 6. Test installation in target repos
cd /path/to/target-repo
npm install @last-rev/watchtower@beta
```

### Stable Release (After Beta Testing)

**Use this when ready for production:**

```bash
# 1. Create a changeset
pnpm changeset
# Select: major (0.x.x → 1.0.0) for first stable
# Describe: "First stable release - production ready"

# 2. Version the package
pnpm run version:stable

# 3. Review changes
git diff package.json CHANGELOG.md

# 4. Commit version changes
git add .
git commit -m "chore: version 1.0.0"

# 5. Build and publish
pnpm run publish:stable

# 6. Tag the release
git tag v1.0.0
git push origin main --tags
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
pnpm changeset
```

You'll be prompted:
1. **Which packages changed?** (Select `@last-rev/watchtower`)
2. **What type of change?** (major/minor/patch)
3. **Summary:** Describe the changes

This creates a file in `.changeset/` that tracks the change.

### Applying Changesets

```bash
# Update version and generate CHANGELOG
pnpm changeset version

# This will:
# - Bump version in package.json
# - Update/create CHANGELOG.md
# - Remove consumed changeset files
```

## 🎯 Recommended First Publish

Since you're currently at `0.1.0` and want to test properly:

### **Option A: Publish as Beta (Safest)**
```bash
# 1. Create changeset for beta
pnpm changeset
# → Select: minor
# → Describe: "Initial beta release - Algolia v5, multi-framework support"

# 2. Version to beta
pnpm changeset version

# 3. Dry run
pnpm run publish:dry-run

# 4. Publish
pnpm run publish:beta

# 5. Test in smartnews
cd /Users/cameron/repos/smartnews/apps/web
# Update package.json: "@last-rev/watchtower": "0.2.0-beta.0"
pnpm install
```

### **Option B: Direct to Stable (If Very Confident)**
```bash
# 1. Create changeset for stable
pnpm changeset
# → Select: major
# → Describe: "First stable release - production ready"

# 2. Version to 1.0.0
pnpm changeset version

# 3. Dry run
pnpm run publish:dry-run

# 4. Publish
pnpm run publish:stable

# 5. Test in smartnews
cd /Users/cameron/repos/smartnews/apps/web
# Update package.json: "@last-rev/watchtower": "^1.0.0"
pnpm install
```

## 🔒 Security Notes

### npm Credentials
- ✅ Stored in `~/.npmrc` (local only, never committed)
- ✅ Check with: `npm whoami` → Should show `you npm username`
- ✅ No need to add anything to this repo

### GitHub Actions (Future)
When you add CI/CD, you'll need:
- Add `NPM_TOKEN` to GitHub Secrets (repository settings)
- Token is used only in CI, never in code
- See `.github/workflows/release.yml` template in implementation plan

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

