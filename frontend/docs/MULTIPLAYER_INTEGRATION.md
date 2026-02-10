# 🎮 GreenGalaxy Multiplayer Integration Guide

## Overview

This document describes the enterprise-grade multiplayer system integrated into GreenGalaxy VR, based on your VR designer's MVP Colyseus server.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GREENGALAXY VR PLATFORM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   FRONTEND (React + React Three Fiber)                              │
│   ├── Firebase Auth (login)                                         │
│   ├── Firestore (spaces, assets, scenes)                           │
│   ├── Colyseus Client (real-time multiplayer) ◄── NEW!             │
│   ├── Ready Player Me Avatars (premium 3D)    ◄── NEW!             │
│   ├── VR Chat System                          ◄── NEW!             │
│   └── Emotes & Animations                     ◄── NEW!             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   BACKEND SERVERS                                                   │
│   ├── Firebase (auth, storage, database)                           │
│   └── Colyseus Server (real-time multiplayer) ◄── From MVP         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `src/services/colyseus/ColyseusService.ts` | Colyseus client wrapper with connection management |
| `src/hooks/useMultiplayer.ts` | React hook for multiplayer state management |
| `src/components/xr/RPMAvatar.tsx` | Ready Player Me avatar with animations |
| `src/components/xr/VRChat.tsx` | Real-time chat & emotes panels |

---

## 🚀 Running the Full Stack

### 1. Start the Colyseus Server (from MVP)

```bash
cd MVP/server
npm install
npm run dev
```

The server will start on `ws://localhost:2567`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`

---

## ✨ Features

### 🎭 Ready Player Me Avatars

- Load 3D avatars from Ready Player Me URLs
- Automatic animation support (idle, wave, clap, dance)
- Fallback capsule avatar if model fails to load
- Name tags with accent colors

### 💬 Real-Time Chat

- Press **Enter** to open chat
- Message history (last 100 messages)
- Sender names and timestamps
- Chat bubbles appear above avatars in 3D

### 🎭 Emotes

- Press **E** to open emotes panel
- Available emotes: Wave 👋, Clap 👏, Dance 💃, Thumbs Up 👍, Thinking 🤔, Celebrate 🎉
- Animations sync across all players

### 🔄 Position Sync

- Smooth 20 updates/second position sync
- Automatic reconnection (5 second grace period)
- VR safety limits enforced (height, speed, bounds)

---

## ⚙️ Configuration

### Environment Variables

```env
# .env
VITE_COLYSEUS_URL=ws://localhost:2567
```

### Enable Colyseus Multiplayer

In `Room.tsx`, the `useColyseusMultiplayer` prop enables the new system:

```tsx
<Room
  useColyseusMultiplayer={true}  // Enable Colyseus
  // ... other props
/>
```

---

## 🌐 Production Deployment

### 1. Deploy Colyseus Server

**Option A: Same server as Firebase Functions**
- Not recommended (Colyseus needs persistent WebSocket)

**Option B: Dedicated VPS (Recommended)**
```bash
# On your VPS
cd MVP/server
npm install
npm run build
npm start
```

Use PM2 for process management:
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
```

### 2. Update Environment Variables

For production, update `.env.production`:
```env
VITE_COLYSEUS_URL=wss://multiplayer.green-galaxy.tech
```

### 3. Configure CORS

In `MVP/server/src/app.config.ts`, ensure CORS allows your domain:
```typescript
initializeExpress: (app) => {
  app.use(cors({
    origin: ['https://app.green-galaxy.tech', 'https://green-galaxy.tech'],
    credentials: true
  }));
}
```

---

## 🔐 Security Considerations

1. **Rate Limiting**: The server limits position updates to prevent spam
2. **Input Validation**: All messages are sanitized (max 500 chars)
3. **Bounds Checking**: Player positions are clamped to world bounds
4. **Reconnection**: 5-second grace period prevents accidental disconnects

---

## 📊 Monitoring

Access the Colyseus monitor at:
```
http://localhost:2567/monitor
```

This shows:
- Active rooms
- Connected players
- Message throughput
- Error logs

---

## 🎯 Next Steps

1. **Avatar Customization**: Allow users to paste their Ready Player Me URL
2. **Voice Chat**: Integrate WebRTC for spatial audio
3. **Screen Sharing**: Share presentations in-world
4. **Persistent Rooms**: Store room state in Firestore
5. **VR Controller Support**: WebXR hand tracking

---

## 📞 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Toggle chat |
| `E` | Toggle emotes |
| `WASD` / Arrow Keys | Movement |
| `Escape` | Exit pointer lock |

---

*GreenGalaxy VR - The Enterprise Metaverse for Google Workspace*
