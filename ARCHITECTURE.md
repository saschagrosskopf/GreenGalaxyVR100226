# 🏗️ GreenGalaxy VR Platform - Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GreenGalaxy VR Platform                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND (React)                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │   React     │  │  Three.js   │  │  WebRTC     │  │  WebXR     │  │   │
│  │  │   + R3F     │  │  3D Engine  │  │  P2P Comms  │  │  VR API    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  │         │                │                │               │          │   │
│  │         └────────────────┴────────────────┴───────────────┘          │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │                     APPLICATION LAYER                          │   │   │
│  │  │  • XRPreview (Main VR View)                                   │   │   │
│  │  │  • Room (3D Scene)                                            │   │   │
│  │  │  • InfiniteCanvas (Collaboration Tools)                       │   │   │
│  │  │  • RPMAvatar (Ready Player Me Integration)                    │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │                      SERVICE LAYER                             │   │   │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐  │   │   │
│  │  │  │ Colyseus   │  │ VoiceChat  │  │ ScreenShare│  │ WebXR   │  │   │   │
│  │  │  │ Service    │  │ Service    │  │ Service    │  │ Manager │  │   │   │
│  │  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬────┘  │   │   │
│  │  │        │               │               │              │       │   │   │
│  │  │        │        ┌──────┴───────────────┘              │       │   │   │
│  │  │        │        │   (P2P via WebRTC)                  │       │   │   │
│  │  │        │        │                                     │       │   │   │
│  │  └────────┼────────┼─────────────────────────────────────┼───────┘   │   │
│  │           │        │                                     │           │   │
│  └───────────┼────────┼─────────────────────────────────────┼───────────┘   │
│              │        │                                     │               │
│              ▼        ▼                                     ▼               │
│  ┌───────────────────────────┐                    ┌─────────────────────┐   │
│  │    COLYSEUS SERVER        │                    │   VR HEADSET        │   │
│  │  ┌─────────────────────┐  │                    │   (WebXR Device)    │   │
│  │  │     MyRoom          │  │                    │                     │   │
│  │  │  • Player State     │  │                    │  • Meta Quest       │   │
│  │  │  • Chat Relay       │  │                    │  • HTC Vive         │   │
│  │  │  • Emote Broadcast  │  │                    │  • Valve Index      │   │
│  │  │  • WebRTC Signaling │  │                    │  • Windows MR       │   │
│  │  └─────────────────────┘  │                    └─────────────────────┘   │
│  └───────────────────────────┘                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Player Movement Sync

```
Local Player Input
       │
       ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  PointerLock     │────▶│  useMultiplayer  │────▶│  ColyseusService │
│  Controls        │     │  (throttled)     │     │  sendPosition()  │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼ WebSocket
                                                  ┌──────────────────┐
                                                  │  Colyseus Server │
                                                  │  (MyRoom)        │
                                                  └────────┬─────────┘
                                                           │
                                             Broadcast to all clients
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Other Clients   │
                                                  │  onPlayerMove()  │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  RPMAvatar       │
                                                  │  (interpolated)  │
                                                  └──────────────────┘
```

### Voice Chat Flow

```
User Microphone
       │
       ▼
┌──────────────────┐
│  VoiceChatService│
│  .enable()       │
└────────┬─────────┘
         │
         │  getUserMedia()
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Local Stream    │────▶│  WebRTC Offer    │
└──────────────────┘     └────────┬─────────┘
                                  │
                            Signaling via Colyseus
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Remote Peer     │
                         │  (Answer)        │
                         └────────┬─────────┘
                                  │
                           ICE Negotiation
                                  │
                                  ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │  P2P Connection  │────▶│  Spatial Audio   │
                         │  Established     │     │  (HRTF Panning)  │
                         └──────────────────┘     └──────────────────┘
```

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── LoginView
│       ├── DashboardView
│       └── XRPreview (Main VR Experience)
│           ├── Canvas (R3F)
│           │   ├── PerspectiveCamera
│           │   ├── PointerLockControls
│           │   ├── SceneLighting
│           │   ├── Room
│           │   │   ├── Furniture (GLB Loader)
│           │   │   ├── SmartScreen
│           │   │   ├── SmartWhiteboard
│           │   │   ├── InfiniteCanvas
│           │   │   │   ├── StickyNote3D
│           │   │   │   ├── Shape3D
│           │   │   │   └── Marker3D
│           │   │   └── RPMAvatar (per player)
│           │   │       ├── GLB Model
│           │   │       ├── NameTag
│           │   │       ├── ChatBubble
│           │   │       └── TypingIndicator
│           │   ├── Environment
│           │   └── EffectComposer (Post-processing)
│           │
│           ├── HUD Layer
│           │   ├── TopStatusBar
│           │   ├── LeftToolPanel
│           │   ├── BottomCanvasToolbar
│           │   ├── VRButton
│           │   ├── PlayerList
│           │   └── KeyboardHelp
│           │
│           ├── Modal Layer
│           │   ├── AIArchitectModal
│           │   └── WorkspacePortal
│           │
│           └── Communication Layer
│               ├── VRChat
│               ├── EmotesPanel
│               └── MediaControls
```

---

## State Management

### Global State (Context)

```typescript
// Authentication
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

// Organization
interface OrgState {
    org: Organization | null;
    spaces: Space[];
    selectedSpace: Space | null;
}
```

### Component State (useState)

```typescript
// XRPreview local state
const [hasEntered, setHasEntered] = useState(false);
const [activeTool, setActiveTool] = useState('cursor');
const [showChat, setShowChat] = useState(false);
const [showEmotes, setShowEmotes] = useState(false);
const [showMediaControls, setShowMediaControls] = useState(false);
const [isInVR, setIsInVR] = useState(false);
```

### Multiplayer State (useMultiplayer)

```typescript
interface MultiplayerState {
    isConnected: boolean;
    isConnecting: boolean;
    players: Map<string, PlayerState>;
    localPlayerId: string | null;
    environment: string;
    error: string | null;
}
```

---

## File Structure

```
GG/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── views/
│   │   │   │   ├── XRPreview.tsx      # Main VR experience
│   │   │   │   ├── Dashboard.tsx      # Space selection
│   │   │   │   └── Login.tsx          # Authentication
│   │   │   └── xr/
│   │   │       ├── Room.tsx           # 3D room scene
│   │   │       ├── RPMAvatar.tsx      # Player avatars
│   │   │       ├── VRChat.tsx         # Chat UI
│   │   │       ├── MediaControls.tsx  # Voice/screen
│   │   │       ├── VRButton.tsx       # Enter VR
│   │   │       ├── PlayerList.tsx     # Online players
│   │   │       ├── KeyboardHelp.tsx   # Shortcuts
│   │   │       ├── Furniture.tsx      # 3D models
│   │   │       ├── SmartScreen.tsx    # Display content
│   │   │       └── InfiniteCanvas.tsx # Collaboration
│   │   │
│   │   ├── services/
│   │   │   ├── colyseus/
│   │   │   │   └── ColyseusService.ts # Multiplayer
│   │   │   ├── VoiceChatService.ts    # WebRTC voice
│   │   │   ├── ScreenShareService.ts  # WebRTC screen
│   │   │   ├── SpatialAudioService.ts # 3D audio
│   │   │   ├── WebXRManager.ts        # VR headsets
│   │   │   └── api.ts                 # REST API
│   │   │
│   │   ├── hooks/
│   │   │   ├── useMultiplayer.ts      # Multiplayer hook
│   │   │   └── useWebXR.ts            # WebXR hook
│   │   │
│   │   └── types.ts
│   │
│   └── .env
│
├── MVP/
│   └── server/
│       ├── src/
│       │   ├── rooms/
│       │   │   ├── MyRoom.ts          # Room logic
│       │   │   └── schema/
│       │   │       └── MyRoomState.ts # State schema
│       │   ├── app.config.ts          # Express/Colyseus
│       │   └── index.ts               # Entry point
│       ├── Dockerfile
│       ├── railway.json
│       └── package.json
│
├── backend/                           # Python API (auth, etc.)
│   └── app/
│       └── main.py
│
├── DEPLOYMENT.md
├── API.md
├── ARCHITECTURE.md
└── render.yaml
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 | UI components |
| **3D Rendering** | Three.js + R3F | WebGL rendering |
| **State Management** | React Context + useState | App state |
| **Multiplayer** | Colyseus | Real-time sync |
| **Voice/Video** | WebRTC | P2P communication |
| **VR Support** | WebXR API | VR headsets |
| **Styling** | Tailwind CSS | UI styling |
| **Build Tool** | Vite | Fast bundling |
| **Language** | TypeScript | Type safety |
| **Server** | Node.js + Express | Colyseus host |
| **Schema** | @colyseus/schema | State sync |

---

## Performance Considerations

### Position Sync Throttling

```typescript
// Only send position updates every 50ms (20 updates/second)
const POSITION_SYNC_INTERVAL = 50;

// Only send if position changed significantly
const POSITION_THRESHOLD = 0.01; // 1cm
```

### Avatar Instancing

```typescript
// Clone GLTF scene to avoid re-downloading
const clonedScene = useMemo(() => {
    return gltf.scene.clone();
}, [gltf.scene]);
```

### Spatial Audio Optimization

```typescript
// HRTF panning for realistic 3D audio
panner.panningModel = 'HRTF';

// Automatic volume falloff based on distance
panner.distanceModel = 'inverse';
panner.maxDistance = 30;
```

---

## Security Considerations

1. **WebRTC ICE**: Using STUN servers for NAT traversal
2. **Message Validation**: Server validates all incoming messages
3. **Rate Limiting**: Position updates throttled client-side
4. **Auth Tokens**: Firebase JWT for authentication
5. **CORS**: Configured for allowed origins
6. **HTTPS Required**: For getUserMedia/getDisplayMedia
