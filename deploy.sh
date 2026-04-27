#!/bin/bash

echo "🚀 Starting clean deployment..."

# 1. Clean up potential conflicts
echo "📥 Cleaning untracked files and syncing..."
git clean -fd
git checkout package.json package-lock.json
git pull origin main

# 2. Clear broken/temp files
echo "🧹 Clearing temporary files..."
rm -rf *.log
rm -rf .tmp
rm -rf .DS_Store
find . -name "npm-debug.log*" -delete

# 3. Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# 4. Build the app
echo "🏗️ Building production assets..."
npm run build

# 5. Sync dist to public_html
echo "📂 Syncing files to public_html..."
# We keep this as a secondary static serving point if nginx is configured for it
mkdir -p /home/stynaff/public_html
cp -rv dist/* /home/stynaff/public_html/

# 6. Restart the server processes
echo "♻️ Restarting app with PM2..."
pm2 startOrRestart ecosystem.config.cjs --env production

echo "✅ Deployment complete! Visit https://styni.com"
