/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎮 COLYSEUS MULTIPLAYER SERVICE
 * Enterprise-grade real-time multiplayer for GreenGalaxy VR
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Client, Room } from 'colyseus.js';
import { MyRoomState, PlayerState as PlayerSchema } from './MyRoomState';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlayerState {
    id: string;
    name: string;
    avatarKey: string;      // RPM avatar identifier (a1, a2, a3, or full URL)
    avatarUrl?: string;     // Full Ready Player Me URL
    x: number;
    y: number;
    z: number;
    ry: number;             // Rotation around Y axis
    isMoving: boolean;      // Synchronized movement state for animations
}

export interface ChatMessage {
    id: string;
    name: string;
    text: string;
    ts: number;
}

export interface EmoteEvent {
    id: string;
    emote: string;          // 'wave', 'clap', 'dance', etc.
}

export interface ScreenState {
    presenterId: string;
    active: boolean;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
    scale: number;
}

export interface RoomState {
    players: Map<string, PlayerState>;
    envKey: string;
    screen?: ScreenState; // Optional until synced
}

export interface JoinOptions {
    name: string;
    avatarKey?: string;
    avatarUrl?: string;
    envKey?: string;
    roomId?: string;        // Added for Colyseus filterBy
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 COLYSEUS SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ColyseusService {
    private client: Client;
    private room: Room<MyRoomState> | null = null;
    private onPlayerJoin: ((player: PlayerState) => void) | null = null;
    private onPlayerLeave: ((playerId: string) => void) | null = null;
    private onPlayerMove: ((player: PlayerState) => void) | null = null;
    private onChat: ((message: ChatMessage) => void) | null = null;
    private onEmote: ((event: EmoteEvent) => void) | null = null;
    private onEnvChange: ((envKey: string) => void) | null = null;
    private onScreenChange: ((state: ScreenState) => void) | null = null;
    private onConnectionChange: ((connected: boolean) => void) | null = null;

    constructor() {
        const url = import.meta.env.VITE_COLYSEUS_URL || 'ws://localhost:2567';
        this.client = new Client(url);
    }

    /**
     * Join a room for a specific space
     */
    async joinRoom(roomId: string, options: JoinOptions): Promise<boolean> {
        try {
            console.log('🎮 Connecting to Colyseus server...');
            console.log('🚪 Joining room:', roomId, 'as', options.name);

            // Join or create using the registered 'my_room' handler.
            // We pass spaceId (was roomId) so Colyseus filterBy can group users into different space instances.
            // "roomId" is reserved by Colyseus and is IGNORED by the server options!
            this.room = await this.client.joinOrCreate('my_room', {
                ...options,
                spaceId: roomId,        // ✅ CORRECT PARAMETER for filtering
                envKey: options.envKey || 'office' // default if not set
            });

            console.log('✅ Joined room:', this.room.roomId);
            this.setupRoomListeners();
            this.onConnectionChange?.(true);

            return true;
        } catch (e) {
            console.error('❌ Failed to join room:', e);
            this.onConnectionChange?.(false);
            return false;
        }
    }

    /**
     * Leave the current room
     */
    async leaveRoom(): Promise<void> {
        if (this.room) {
            await this.room.leave();
            this.room = null;
            this.onConnectionChange?.(false);
        }
    }

    /**
     * Send current player position to server
     */
    sendPosition(x: number, y: number, z: number, ry: number, isMoving: boolean = false): void {
        if (!this.room) return;
        this.room.send('move', { x, y, z, ry, isMoving });
    }

    /**
     * Send a chat message
     */
    sendChat(text: string): void {
        if (!this.room) return;
        this.room.send('chat', { text });
    }

    /**
     * Send an emote trigger
     */
    sendEmote(emote: string): void {
        if (!this.room) return;
        this.room.send('emote', { emote });
    }

    /**
     * Update 3D screen transform (Presenter only)
     */
    sendScreenTransform(transform: Partial<ScreenState>): void {
        if (!this.room) return;
        this.room.send('screen-update-transform', transform);
    }

    /**
     * Start Screen Share synchronization
     */
    sendScreenStart(): void {
        console.log("📡 Sending screen-start to Colyseus");
        this.room?.send('screen-start');
    }

    /**
     * Stop Screen Share synchronization
     */
    sendScreenStop(): void {
        console.log("📡 Sending screen-stop to Colyseus");
        this.room?.send('screen-stop');
    }

    /**
     * Get current session ID
     */
    getSessionId(): string | null {
        return this.room?.sessionId || null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private mapPlayerState(player: PlayerSchema, key: string): PlayerState {
        return {
            id: player.id || key,
            name: player.name || 'Guest',
            avatarKey: player.avatarKey || 'a1',
            avatarUrl: player.avatarUrl || "",
            x: player.x ?? 0,
            y: player.y ?? 1.8,
            z: player.z ?? 0,
            ry: player.ry ?? 0,
            isMoving: player.isMoving || false
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 ROOM EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    private setupRoomListeners(): void {
        if (!this.room) return;

        console.log('📡 Setting up room listeners for:', this.room.roomId);
        const state = this.room.state;
        console.log('📦 Initial state object keys:', Object.keys(state || {}));

        if (state && (state as any).players) {
            console.log('👥 Current state players count:', (state as any).players.size);

            // Log each player currently in state
            (state as any).players.forEach((player: PlayerSchema, key: string) => {
                console.log('👤 Existing player in state:', key, player.name);
                this.onPlayerJoin?.(this.mapPlayerState(player, key));
            });

            // 2. REGISTER SCHEMA LISTENERS (Correctly as methods)
            (state.players as any).onAdd((player: PlayerSchema, key: string) => {
                try {
                    console.log('👤 Player added to state:', player.name || key);
                    this.onPlayerJoin?.(this.mapPlayerState(player, key));
                } catch (e) {
                    console.error('❌ Error in onAdd listener:', e);
                }
            });

            (state.players as any).onRemove((player: PlayerSchema, key: string) => {
                try {
                    console.log('👋 Player removed from state:', key);
                    this.onPlayerLeave?.(key);
                } catch (e) {
                    console.error('❌ Error in onRemove listener:', e);
                }
            });

            (state.players as any).onChange((player: PlayerSchema, key: string) => {
                try {
                    this.onPlayerMove?.(this.mapPlayerState(player, key));
                } catch (e) {
                    console.error('❌ Error in onChange listener:', e);
                }
            });
        }

        // Environment changes
        if (state && typeof (state as any).listen === 'function') {
            (state as any).listen('envKey', (value: string) => {
                console.log('🌍 Environment changed to:', value);
                this.onEnvChange?.(value);
            });
        }

        // 🖥️ SCREEN STATE LISTENER
        if (state && (state as any).screen) {
            console.log('🖥️ Setting up Screen State listener');
            // Listen for any change in the screen schema
            (state as any).screen.onChange(() => {
                console.log('🖥️ Colyseus: Screen State Changed in Schema');
                const s = (state as any).screen;
                const mappedState: ScreenState = {
                    active: s.active,
                    presenterId: s.presenterId,
                    x: s.x, y: s.y, z: s.z,
                    rx: s.rx, ry: s.ry, rz: s.rz,
                    scale: s.scale
                };
                this.onScreenChange?.(mappedState);
            });
        } else {
            console.warn('⚠️ Colyseus: state.screen is MISSING during setup!');
        }

        // Fallback: Use room-wide state change listener
        this.room.onStateChange((newState: any) => {
            console.log('🔄 onStateChange triggered. Players:', newState?.players?.size);

            // If the specific listeners failed but we have players, do a "Force Sync"
            if (newState?.players && newState.players.size > 0 && this.onPlayerJoin) {
                newState.players.forEach((player: PlayerSchema, key: string) => {
                    this.onPlayerJoin?.(this.mapPlayerState(player, key));
                });
            }
        });

        // Chat messages
        this.room.onMessage('chat', (message: ChatMessage) => {
            console.log('💬 Chat:', message.name, '-', message.text);
            this.onChat?.(message);
        });

        // Emote events
        this.room.onMessage('emote', (event: EmoteEvent) => {
            console.log('🎭 Emote:', event.id, '-', event.emote);
            this.onEmote?.(event);
        });

        // ═══════════════════════════════════════════════════════════════════════
        // 🎤 VOICE CHAT SIGNALING
        // ═══════════════════════════════════════════════════════════════════════

        this.room.onMessage('voice-signal', (data: { type: string; peerId: string; peerName: string; data: any }) => {
            this.onVoiceSignal?.(data);
        });

        this.room.onMessage('voice-peer-joined', (data: { id: string; name: string }) => {
            this.onVoicePeerJoined?.(data.id, data.name);
        });

        this.room.onMessage('voice-peer-left', (data: { id: string }) => {
            this.onVoicePeerLeft?.(data.id);
        });

        // ═══════════════════════════════════════════════════════════════════════
        // 🖥️ SCREEN SHARE SIGNALING
        // ═══════════════════════════════════════════════════════════════════════

        this.room.onMessage('screen-signal', (data: { type: string; peerId: string; data: any }) => {
            this.onScreenSignal?.(data);
        });

        this.room.onMessage('screen-presenter', (data: { id: string; name: string }) => {
            this.onScreenPresenter?.(data.id, data.name);
        });

        this.room.onMessage('screen-ended', (data: { id: string }) => {
            this.onScreenEnded?.(data.id);
        });

        // 🛡️ ZOMBIE DEFENSE: Explicit leave message listener
        this.room.onMessage('player-left', (data: { id: string }) => {
            console.log('⚡ FORCE REMOVE PLAYER (Broadcast):', data.id);
            this.onPlayerLeave?.(data.id);
        });
    }

    /**
     * Setters for event listeners
     * Implementation note: If we are already in a room, immediately sync 
     * existing state to the new callback to avoid race conditions.
     */
    setOnPlayerJoin(cb: (player: PlayerState) => void) {
        this.onPlayerJoin = cb;
        if (this.room?.state?.players) {
            console.log('🔄 Latent sync: Sending existing players to new join listener');
            this.room.state.players.forEach((player: any, key: string) => {
                cb(this.mapPlayerState(player, key));
            });
        }
    }
    setOnPlayerLeave(cb: (playerId: string) => void) { this.onPlayerLeave = cb; }
    setOnPlayerMove(cb: (player: PlayerState) => void) {
        this.onPlayerMove = cb;
        if (this.room?.state?.players) {
            this.room.state.players.forEach((player: any, key: string) => {
                cb(this.mapPlayerState(player, key));
            });
        }
    }
    setOnChat(cb: (message: ChatMessage) => void) { this.onChat = cb; }
    setOnEmote(cb: (event: EmoteEvent) => void) { this.onEmote = cb; }
    setOnEnvChange(cb: (envKey: string) => void) { this.onEnvChange = cb; }
    setOnConnectionChange(cb: (connected: boolean) => void) { this.onConnectionChange = cb; }

    // Objets for signaling
    private onVoiceSignal: ((data: any) => void) | null = null;
    private onVoicePeerJoined: ((id: string, name: string) => void) | null = null;
    private onVoicePeerLeft: ((id: string) => void) | null = null;
    private onScreenSignal: ((data: any) => void) | null = null;
    private onScreenPresenter: ((id: string, name: string) => void) | null = null;
    private onScreenEnded: ((id: string) => void) | null = null;

    setOnVoiceSignal(cb: (data: any) => void) { this.onVoiceSignal = cb; }
    setOnVoicePeerJoined(cb: (id: string, name: string) => void) { this.onVoicePeerJoined = cb; }
    setOnVoicePeerLeft(cb: (id: string) => void) { this.onVoicePeerLeft = cb; }
    setOnScreenSignal(cb: (data: any) => void) { this.onScreenSignal = cb; }
    setOnScreenPresenter(cb: (id: string, name: string) => void) { this.onScreenPresenter = cb; }
    setOnScreenEnded(cb: (id: string) => void) { this.onScreenEnded = cb; }
    setOnScreenChange(cb: (state: ScreenState) => void) {
        this.onScreenChange = cb;
        // Immediate sync if state exists
        if (this.room?.state && (this.room.state as any).screen) {
            const s = (this.room.state as any).screen;
            cb({
                active: s.active,
                presenterId: s.presenterId,
                x: s.x, y: s.y, z: s.z,
                rx: s.rx, ry: s.ry, rz: s.rz,
                scale: s.scale
            });
        }
    }
}

const colyseusService = new ColyseusService();
export { colyseusService };
// Export types are already at the top, let's keep them there vs here if that was the plan.
// Actually, they ARE exported at the top as interfaces, which is fine.
// Removing the redundant export type here to avoid double-export confusion if any.
// export type { PlayerState, ChatMessage, EmoteEvent, RoomState, JoinOptions };
