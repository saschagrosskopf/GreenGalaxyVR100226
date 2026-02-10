# 🚀 GreenGalaxy VR Platform Deployment Guide

## Quick Start

### 1. Start Colyseus Server (Development)

```bash
cd MVP/server
npm install
npm run dev
```

Server will be available at `ws://localhost:2567`

### 2. Start Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## Production Deployment

### Option A: Railway.app (Recommended - Easiest)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select the `MVP/server` folder
5. Railway will auto-detect the Dockerfile and deploy

**Environment Variables to set:**
- `NODE_ENV=production`
- `PORT=2567`

### Option B: Render.com

1. Push your code to GitHub (including `render.yaml` at root)
2. Go to [render.com](https://render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repo
5. It will auto-configure from `render.yaml`

### Option C: Docker (Self-hosted)

```bash
cd MVP

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f colyseus

# Stop
docker-compose down
```

---

## Frontend Configuration

Update `frontend/.env` with your production Colyseus URL:

```env
VITE_COLYSEUS_URL=wss://your-colyseus-server.railway.app
```

---

## Features Implemented

### ✅ Multiplayer System
- [x] Colyseus server with room management
- [x] Player position synchronization
- [x] Chat messaging
- [x] Emote system

### ✅ Voice Chat (WebRTC)
- [x] Peer-to-peer voice connections
- [x] Mute/unmute controls
- [x] Deafen (mute incoming) control
- [x] Voice activity detection
- [x] Speaking indicators

### ✅ Screen Sharing (WebRTC)
- [x] Screen capture API integration
- [x] Presenter/viewer roles
- [x] Real-time stream sharing

### ✅ VR Headset Support (WebXR)
- [x] Meta Quest support
- [x] HTC Vive support
- [x] Valve Index support
- [x] Controller tracking
- [x] Teleportation ready

### ⏳ Awaiting
- [ ] Animated avatar GLB (from designer)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│  Colyseus       │
│  (React/R3F)    │◀────│  Server         │
└────────┬────────┘     └─────────────────┘
         │                       │
         │    ┌─────────────────────────┐
         └───▶│  WebRTC (P2P)           │
              │  - Voice Chat           │
              │  - Screen Share         │
              └─────────────────────────┘
```

---

## Troubleshooting

### Colyseus Connection Failed
1. Check if server is running: `curl http://localhost:2567/hello_world`
2. Verify firewall allows port 2567
3. Check CORS settings if cross-origin

### Voice Chat Not Working
1. Ensure HTTPS in production (required for getUserMedia)
2. Check browser microphone permissions
3. Verify STUN/TURN servers are reachable

### Screen Share Not Working
1. Ensure HTTPS in production (required for getDisplayMedia)
2. Check browser permissions
3. Some browsers require user gesture to start

### VR Not Detected
1. Use Chrome/Edge (best WebXR support)
2. Ensure headset is connected and SteamVR/Oculus running
3. Check `navigator.xr` availability in console

---

## API Reference

### Colyseus Messages

| Message | Direction | Description |
|---------|-----------|-------------|
| `move` | Client → Server | Player position update |
| `chat` | Bidirectional | Chat message |
| `emote` | Bidirectional | Emote trigger |
| `voice-signal` | Bidirectional | WebRTC signaling |
| `screen-signal` | Bidirectional | Screen share signaling |

---

## Support

For issues, check:
1. Browser console for frontend errors
2. Server console for Colyseus errors
3. Network tab for WebSocket issues
