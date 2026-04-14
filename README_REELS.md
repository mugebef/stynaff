# STYN Reels Deployment Guide

This guide provides instructions for deploying and managing the TikTok-style Reels system on your VPS.

## 1. Prerequisites
- Node.js installed
- PM2 installed (`npm install -g pm2`)
- Nginx installed
- MongoDB (Optional: The current system uses Firestore, but can be adapted)

## 2. PM2 Configuration
To run the server with PM2, use the following command from the project root:

```bash
pm2 start server.ts --name "styn-server" --interpreter tsx
```

Or use the provided `ecosystem.config.cjs`:
```bash
pm2 start ecosystem.config.cjs
```

## 3. Nginx Configuration
Update your Nginx configuration (e.g., `/etc/nginx/conf.d/styni.com.conf`) to handle video uploads and static serving.

```nginx
server {
    listen 80;
    server_name styni.com www.styni.com;

    # Increase client body size for video uploads
    client_max_body_size 100M;

    root /home/styni.com/public_html;
    index index.html index.htm;

    # Serve uploaded videos directly via Nginx for performance
    location /uploads/ {
        alias /home/styni.com/stynaff/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Proxy API requests to Node.js server
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 4. Performance Optimization
- **Video Compression:** The server currently saves videos as-is. For production, consider using `ffmpeg` to compress videos on upload.
- **Lazy Loading:** The React frontend uses `activeIndex` to only play the current video in view.
- **Static Serving:** Nginx is configured to serve the `/uploads/` folder directly, bypassing Node.js for better performance.

## 5. Mobile-First Features
- **Vertical Swipe:** Uses CSS scroll snapping (`snap-y snap-mandatory`).
- **Double Tap:** Implemented custom double-tap gesture to like.
- **Auto-play:** Videos play/pause automatically based on scroll position.
