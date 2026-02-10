# 📚 GreenGalaxy VR Platform - API Reference

## Table of Contents

1. [Colyseus Multiplayer](#colyseus-multiplayer)
2. [Voice Chat Service](#voice-chat-service)
3. [Screen Share Service](#screen-share-service)
4. [WebXR Manager](#webxr-manager)
5. [Spatial Audio Service](#spatial-audio-service)
6. [React Hooks](#react-hooks)
7. [Components](#components)

---

## Colyseus Multiplayer

The multiplayer system uses Colyseus for real-time synchronization.

### ColyseusService

```typescript
import { colyseusService } from './services/colyseus/ColyseusService';
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connect()` | - | `Promise<boolean>` | Connect to Colyseus server |
| `joinRoom(roomId, options)` | `roomId: string, options: JoinOptions` | `Promise<boolean>` | Join a multiplayer room |
| `leaveRoom()` | - | `Promise<void>` | Leave current room |
| `sendPosition(x, y, z, ry)` | `x, y, z, ry: number` | `void` | Update player position |
| `sendChat(text)` | `text: string` | `void` | Send chat message |
| `sendEmote(emote)` | `emote: string` | `void` | Trigger emote animation |
| `isConnected()` | - | `boolean` | Check connection status |
| `getSessionId()` | - | `string \| null` | Get local player session ID |
| `getPlayers()` | - | `PlayerState[]` | Get all connected players |

#### Event Subscriptions

```typescript
// Player events
colyseusService.setOnPlayerJoin((player: PlayerState) => { ... });
colyseusService.setOnPlayerLeave((playerId: string) => { ... });
colyseusService.setOnPlayerMove((player: PlayerState) => { ... });

// Communication events
colyseusService.setOnChat((message: ChatMessage) => { ... });
colyseusService.setOnEmote((event: EmoteEvent) => { ... });

// Voice/Screen signaling
colyseusService.setOnVoiceSignal((data) => { ... });
colyseusService.setOnVoicePeerJoined((peerId, peerName) => { ... });
colyseusService.setOnVoicePeerLeft((peerId) => { ... });
colyseusService.setOnScreenSignal((data) => { ... });
colyseusService.setOnScreenPresenter((presenterId, name) => { ... });
colyseusService.setOnScreenEnded((presenterId) => { ... });
```

#### Types

```typescript
interface PlayerState {
    id: string;
    name: string;
    avatarKey: string;
    avatarUrl?: string;
    x: number;
    y: number;
    z: number;
    ry: number;
}

interface ChatMessage {
    id: string;
    name: string;
    text: string;
    ts: number;
}

interface EmoteEvent {
    id: string;
    emote: string;  // 'wave', 'clap', 'dance', etc.
}

interface JoinOptions {
    name: string;
    avatarKey?: string;
    avatarUrl?: string;
    envKey?: string;
}
```

---

## Voice Chat Service

WebRTC-based peer-to-peer voice communication.

### VoiceChatService

```typescript
import { voiceChatService } from './services/VoiceChatService';
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `enable()` | - | `Promise<boolean>` | Request microphone access |
| `disable()` | - | `void` | Stop voice chat |
| `toggleMute()` | - | `boolean` | Toggle local microphone |
| `toggleDeafen()` | - | `boolean` | Mute all incoming audio |
| `connectToPeer(peerId, name)` | `peerId, name: string` | `Promise<void>` | Initiate voice call |
| `disconnectFromPeer(peerId)` | `peerId: string` | `void` | End voice call |
| `handleOffer(peerId, name, offer)` | - | `Promise<void>` | Handle incoming call |
| `handleAnswer(peerId, answer)` | - | `Promise<void>` | Handle call acceptance |
| `handleIceCandidate(peerId, candidate)` | - | `Promise<void>` | Handle ICE candidate |
| `getState()` | - | `VoiceState` | Get current voice state |

#### Callbacks

```typescript
voiceChatService.setCallbacks({
    onPeerJoined: (peerId, name) => { ... },
    onPeerLeft: (peerId) => { ... },
    onPeerSpeaking: (peerId, isSpeaking) => { ... },
    onError: (error) => { ... }
});

// For WebRTC signaling through Colyseus
voiceChatService.setSignalHandler((type, peerId, data) => {
    colyseusService.sendVoiceSignal(type, peerId, data);
});
```

---

## Screen Share Service

WebRTC screen capture and sharing.

### ScreenShareService

```typescript
import { screenShareService } from './services/ScreenShareService';
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `startSharing()` | - | `Promise<MediaStream \| null>` | Start screen capture |
| `stopSharing()` | - | `void` | Stop sharing |
| `shareToViewer(viewerId)` | `viewerId: string` | `Promise<void>` | Share to specific peer |
| `handleScreenOffer(presenterId, offer)` | - | `Promise<void>` | Receive screen share |
| `handleScreenAnswer(viewerId, answer)` | - | `Promise<void>` | Complete connection |
| `createVideoElement(stream)` | `MediaStream` | `HTMLVideoElement` | For Three.js texture |
| `isScreenSharing()` | - | `boolean` | Check if sharing |
| `getCurrentPresenter()` | - | `string \| null` | Get presenter ID |

#### Callbacks

```typescript
screenShareService.setCallbacks({
    onStartSharing: (stream) => { ... },
    onStopSharing: () => { ... },
    onRemoteShare: (peerId, stream) => { ... },
    onRemoteShareEnd: (peerId) => { ... },
    onError: (error) => { ... }
});
```

---

## WebXR Manager

VR headset integration using WebXR API.

### WebXRManager

```typescript
import { webXRManager } from './services/WebXRManager';
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `checkSupport()` | - | `Promise<boolean>` | Check VR availability |
| `checkARSupport()` | - | `Promise<boolean>` | Check AR availability |
| `initialize(renderer)` | `THREE.WebGLRenderer` | `void` | Setup with Three.js |
| `startVRSession()` | - | `Promise<boolean>` | Enter VR mode |
| `endSession()` | - | `Promise<void>` | Exit VR mode |
| `getController(index)` | `0 \| 1` | `THREE.Group \| null` | Get controller object |
| `getControllerGrip(index)` | `0 \| 1` | `THREE.Group \| null` | Get grip for models |
| `createTeleportRay()` | - | `THREE.Line` | Teleport visualization |
| `createTeleportTarget()` | - | `THREE.Mesh` | Teleport marker |
| `createControllerModel(hand)` | `'left' \| 'right'` | `THREE.Group` | Fallback controller |
| `getState()` | - | `XRState` | Current XR state |
| `isVRActive()` | - | `boolean` | Check VR active |

#### Callbacks

```typescript
webXRManager.setCallbacks({
    onSessionStart: () => { ... },
    onSessionEnd: () => { ... },
    onControllerConnected: (controller) => { ... },
    onControllerDisconnected: (hand) => { ... },
    onSelectStart: (hand, position) => { ... },
    onSelectEnd: (hand) => { ... },
    onSqueeze: (hand) => { ... }
});
```

---

## Spatial Audio Service

3D positional audio for voice chat.

### SpatialAudioService

```typescript
import { spatialAudioService } from './services/SpatialAudioService';
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `enable()` | - | `Promise<boolean>` | Initialize audio context |
| `disable()` | - | `void` | Cleanup |
| `addSource(id, stream, position)` | `string, MediaStream, Vector3` | `void` | Add 3D audio |
| `updateSourcePosition(id, position)` | `string, Vector3` | `void` | Move audio source |
| `removeSource(id)` | `string` | `void` | Remove audio |
| `updateListener(position, orientation)` | `Vector3, Quaternion` | `void` | Update camera |
| `setMasterVolume(volume)` | `0-1` | `void` | Global volume |
| `setSourceVolume(id, volume)` | `string, 0-1` | `void` | Per-source volume |
| `getDistanceToSource(id)` | `string` | `number` | Distance in meters |

---

## React Hooks

### useMultiplayer

```typescript
import { useMultiplayer } from './hooks/useMultiplayer';

const {
    state,           // MultiplayerState
    players,         // PlayerState[]
    otherPlayers,    // PlayerState[] (excluding local)
    chatMessages,    // ChatMessage[]
    activeEmotes,    // Map<string, string>
    connect,         // () => Promise<boolean>
    disconnect,      // () => Promise<void>
    sendPosition,    // (x, y, z, ry) => void
    sendChat,        // (text) => void
    sendEmote        // (emote) => void
} = useMultiplayer({
    roomId: 'my-room',
    userName: 'Player1',
    avatarUrl: 'https://...',
    onPlayerJoin: (player) => { ... },
    onPlayerLeave: (playerId) => { ... },
    onChat: (message) => { ... },
    onEmote: (event) => { ... }
});
```

### useWebXR

```typescript
import { useWebXR } from './hooks/useWebXR';

const {
    isSupported,     // boolean
    isActive,        // boolean
    controllers,     // XRControllerState[]
    enterVR,         // () => Promise<boolean>
    exitVR,          // () => Promise<void>
    state            // XRState
} = useWebXR({
    onEnterVR: () => { ... },
    onExitVR: () => { ... },
    onSelectStart: (hand, position) => { ... },
    onSelectEnd: (hand) => { ... },
    onSqueeze: (hand) => { ... }
});
```

---

## Components

### VRButton

```tsx
import { VRButton } from './components/xr/VRButton';

<VRButton
    onEnterVR={() => console.log('Entered VR')}
    onExitVR={() => console.log('Exited VR')}
    accentColor="#06B6D4"
/>
```

### MediaControls

```tsx
import { MediaControls } from './components/xr/MediaControls';

<MediaControls
    isOpen={showControls}
    onToggle={() => setShowControls(!showControls)}
    accentColor="#06B6D4"
    userName="Player1"
/>
```

### PlayerList

```tsx
import { PlayerList } from './components/xr/PlayerList';

<PlayerList
    players={players}
    localPlayerId={myId}
    onPlayerClick={(id) => focusOnPlayer(id)}
    onMutePlayer={(id) => mutePlayer(id)}
    accentColor="#06B6D4"
/>
```

### KeyboardHelp

```tsx
import { KeyboardHelp } from './components/xr/KeyboardHelp';

<KeyboardHelp
    isOpen={showHelp}
    onClose={() => setShowHelp(false)}
/>
```

### VRChat & EmotesPanel

```tsx
import { VRChat, EmotesPanel } from './components/xr/VRChat';

<VRChat
    isOpen={showChat}
    onToggle={() => setShowChat(!showChat)}
    accentColor="#06B6D4"
    userName="Player1"
/>

<EmotesPanel
    isOpen={showEmotes}
    onToggle={() => setShowEmotes(!showEmotes)}
    onEmote={(emote) => handleEmote(emote)}
    accentColor="#06B6D4"
/>
```

---

## Colyseus Server Messages

### Client → Server

| Message | Payload | Description |
|---------|---------|-------------|
| `move` | `{ x, y, z, ry }` | Position update |
| `chat` | `{ text }` | Send chat |
| `emote` | `{ emote }` | Play emote |
| `voice-signal` | `{ type, peerId, data }` | WebRTC signaling |
| `voice-join` | `{}` | Join voice channel |
| `voice-leave` | `{}` | Leave voice channel |
| `screen-signal` | `{ type, peerId, data }` | Screen share signaling |
| `screen-start` | `{}` | Start presenting |
| `screen-stop` | `{}` | Stop presenting |

### Server → Client

| Message | Payload | Description |
|---------|---------|-------------|
| `chat` | `{ id, name, text, ts }` | Chat broadcast |
| `emote` | `{ id, emote }` | Emote broadcast |
| `voice-signal` | `{ type, peerId, peerName, data }` | Voice signaling |
| `voice-peer-joined` | `{ id, name }` | Player joined voice |
| `voice-peer-left` | `{ id }` | Player left voice |
| `screen-signal` | `{ type, peerId, data }` | Screen signaling |
| `screen-presenter` | `{ id, name }` | Someone started presenting |
| `screen-ended` | `{ id }` | Presenter stopped |

---

## Environment Variables

### Frontend (.env)

```env
VITE_COLYSEUS_URL=ws://localhost:2567
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Server (.env)

```env
NODE_ENV=development
PORT=2567
```

---

## Error Handling

All services follow this pattern:

```typescript
try {
    const result = await service.action();
    if (!result) {
        // Handle failure
    }
} catch (error) {
    console.error('Error:', error);
}
```

Use the callback system for async errors:

```typescript
service.setCallbacks({
    onError: (error: string) => {
        showNotification(error);
    }
});
```
