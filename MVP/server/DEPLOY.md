# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 COLYSEUS SERVER PRODUCTION DEPLOYMENT
# Deploy to Railway, Render, or any Node.js host
# ═══════════════════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════════════════════
# OPTION 1: RAILWAY (Recommended - Easy & Free Tier)
# ════════════════════════════════════════════════════════════════════════════════

## 1. Install Railway CLI
# npm install -g @railway/cli

## 2. Login to Railway
# railway login

## 3. Deploy from MVP/server directory
# cd c:\Users\user\Downloads\GG\MVP\server
# railway init
# railway up

## 4. Get your deployment URL
# railway domain

## 5. Update frontend .env.production
# VITE_COLYSEUS_URL=wss://your-app.up.railway.app


# ════════════════════════════════════════════════════════════════════════════════
# OPTION 2: RENDER (Free with WebSocket support)
# ════════════════════════════════════════════════════════════════════════════════

## 1. Push to GitHub
# cd MVP/server && git init && git add . && git commit -m "Colyseus server"
# git remote add origin https://github.com/YOUR_USER/greengalaxy-multiplayer.git
# git push -u origin main

## 2. Create new Web Service on render.com
## - Connect your GitHub repo
## - Build Command: npm install && npm run build
## - Start Command: npm start
## - Environment: NODE_ENV=production

## 3. Set environment variable in Render dashboard:
## PORT=2567

## 4. Get your URL: https://greengalaxy-multiplayer.onrender.com


# ════════════════════════════════════════════════════════════════════════════════
# OPTION 3: COLYSEUS CLOUD (Official, Managed)
# ════════════════════════════════════════════════════════════════════════════════

## Visit: https://cloud.colyseus.io
## - One-click deployment
## - Auto-scaling
## - Built-in monitoring
## - Paid but very easy


# ════════════════════════════════════════════════════════════════════════════════
# OPTION 4: VPS (DigitalOcean, Hetzner, etc.)
# ════════════════════════════════════════════════════════════════════════════════

## 1. SSH into your server
# ssh root@your-server-ip

## 2. Install Node.js 20+
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt-get install -y nodejs

## 3. Clone or upload the code
# git clone https://github.com/YOUR_USER/greengalaxy-multiplayer.git
# cd greengalaxy-multiplayer

## 4. Install dependencies
# npm install

## 5. Build
# npm run build

## 6. Install PM2 for process management
# npm install -g pm2

## 7. Start with PM2
# pm2 start ecosystem.config.cjs

## 8. Setup Nginx reverse proxy (for HTTPS/WSS)
# See nginx.conf below

## 9. Setup SSL with Certbot
# sudo apt install certbot python3-certbot-nginx
# sudo certbot --nginx -d multiplayer.green-galaxy.tech
