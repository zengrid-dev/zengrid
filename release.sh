#!/bin/bash

# ZenGrid v1.0.0 Release Script
# This script will help you publish the release to GitHub

set -e

echo "🚀 ZenGrid v1.0.0 Release Script"
echo "================================"
echo ""

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  Warning: You're on branch '$BRANCH', not 'main'"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Show what will be pushed
echo "📋 Commits to be pushed:"
git log origin/main..HEAD --oneline
echo ""

echo "🏷️  Tags to be pushed:"
git tag -l "v1.0.0"
echo ""

# Confirm push
read -p "Push to GitHub? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

# Try to push
echo "📤 Pushing to GitHub..."
if git push origin main --tags; then
  echo "✅ Successfully pushed to GitHub!"
else
  echo "❌ Push failed. You may need to configure authentication."
  echo ""
  echo "Options:"
  echo "1. Use GitHub CLI: gh auth login"
  echo "2. Use SSH: git remote set-url origin git@github.com:zengrid-dev/zengrid.git"
  echo "3. Use Personal Access Token"
  exit 1
fi

echo ""
echo "📦 Creating GitHub Release..."

# Create release using gh CLI
if command -v gh &> /dev/null; then
  gh release create v1.0.0 \
    --title "ZenGrid v1.0.0 - Initial Release" \
    --notes-file RELEASE_NOTES_v1.0.0.md \
    --draft

  echo ""
  echo "✅ Release draft created successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Review the release at: https://github.com/zengrid-dev/zengrid/releases"
  echo "2. Edit if needed"
  echo "3. Click 'Publish release' when ready"
else
  echo "⚠️  GitHub CLI not found. Creating release manually..."
  echo ""
  echo "Please create the release manually:"
  echo "1. Go to: https://github.com/zengrid-dev/zengrid/releases/new"
  echo "2. Choose tag: v1.0.0"
  echo "3. Release title: ZenGrid v1.0.0 - Initial Release"
  echo "4. Copy content from: RELEASE_NOTES_v1.0.0.md"
fi

echo ""
echo "🎉 Done!"
