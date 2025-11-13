#!/bin/bash
# Script to create a GitHub release from CHANGELOG.md

set -e

VERSION=$(node -p "require('../package.json').version")
TAG="v$VERSION"

echo "Creating release for version $VERSION..."

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists"
else
  # Create tag
  git tag -a "$TAG" -m "Release $TAG"
  git push origin "$TAG"
  echo "Created and pushed tag $TAG"
fi

# Extract release notes from CHANGELOG
awk "/^## $VERSION/,/^## /" CHANGELOG.md | sed '$d' > /tmp/release_notes.md

# Remove the version header line
sed -i '' '1d' /tmp/release_notes.md 2>/dev/null || sed -i '1d' /tmp/release_notes.md

# Clean up any trailing "## " lines
sed -i '' '/^## $/d' /tmp/release_notes.md 2>/dev/null || sed -i '/^## $/d' /tmp/release_notes.md

# Create release using GitHub CLI
if command -v gh &> /dev/null; then
  gh release create "$TAG" \
    --title "Release $TAG" \
    --notes-file /tmp/release_notes.md
  echo "Created GitHub release $TAG"
else
  echo "GitHub CLI (gh) not found. Release notes prepared at /tmp/release_notes.md"
  echo "Create release manually at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/new?tag=$TAG"
fi

rm -f /tmp/release_notes.md

