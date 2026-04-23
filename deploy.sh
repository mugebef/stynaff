#!/bin/bash

echo "🚀 Starting clean deployment..."

# 1. Clean up potential conflicts
echo "📥 Cleaning untracked files and syncing with GitHub..."
git clean -fd android/ capacitor.config.ts assets/
git checkout package.json package-lock.json
git pull origin main

# 2. Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# 3. Build the app
echo "🏗️ Building production assets..."
npm run build

# 4. Sync dist to public_html (adjusting for your server path)
echo "📂 Syncing files to public_html..."
# Note: Based on your logs, your server expects dist contents in public_html
cp -rv dist/* /home/styni.com/public_html/

# 5. Restart the server processes
echo "♻️ Restarting app with PM2..."
pm2 restart all

echo "✅ Deployment complete! Visit https://styni.com"
