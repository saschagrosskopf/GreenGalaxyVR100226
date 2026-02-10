import { Room, Client } from "colyseus";
import { MyRoomState, PlayerState } from "./schema/MyRoomState";

type JoinOptions = { name?: string; avatarKey?: string; avatarUrl?: string; envKey?: string };

export class MyRoom extends Room<MyRoomState> {
    maxClients = 32;
    customRoomId: string = "";

    onCreate(options: any) {
        // 🚀 HIGH PERFORMANCE MODE
        // Set update rate to ~60fps (16ms) to ensure smooth movement locally
        this.setPatchRate(16);

        // Track the INTENDED room ID for this instance
        // "roomId" is reserved by Colyseus, so we use "spaceId"
        this.customRoomId = options.spaceId || "default";
        console.log("✅ MyRoom created. Intended Scope:", this.customRoomId);
        this.setMetadata({ spaceId: this.customRoomId });

        this.autoDispose = false;
        this.setState(new MyRoomState());

        console.log("✅ MyRoom created physical ID:", this.roomId);

        this.onMessage("move", (client, msg: Partial<{ x: number; y: number; z: number; ry: number; isMoving?: boolean }>) => {
            const p = this.state.players.get(client.sessionId);
            if (!p) return;

            if (typeof msg.x === "number") p.x = Math.max(-50, Math.min(50, msg.x));
            if (typeof msg.y === "number") p.y = Math.max(-50, Math.min(50, msg.y));
            if (typeof msg.z === "number") p.z = Math.max(-50, Math.min(50, msg.z));
            if (typeof msg.ry === "number") p.ry = msg.ry;
            if (typeof msg.isMoving === "boolean") p.isMoving = msg.isMoving;
        });

        this.onMessage("chat", (client, msg: { text?: string }) => {
            const text = (msg?.text ?? "").toString().trim();
            if (!text) return;

            const p = this.state.players.get(client.sessionId);
            const name = p?.name ?? "Guest";

            this.broadcast("chat", {
                id: client.sessionId,
                name,
                text: text.slice(0, 500),
                ts: Date.now(),
            });
        });

        this.onMessage("emote", (client, data: { emote?: string }) => {
            const emote = (data?.emote ?? "").toString();
            if (!emote) return;
            this.broadcast("emote", { id: client.sessionId, emote });
        });

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎤 VOICE CHAT SIGNALING (WebRTC)
        // ═══════════════════════════════════════════════════════════════════════════

        this.onMessage("voice-signal", (client, data: { type: string; peerId: string; data: any }) => {
            const { type, peerId, data: signalData } = data;

            // Find target client and relay the signal
            const targetClient = this.clients.find(c => c.sessionId === peerId);
            if (targetClient) {
                const senderPlayer = this.state.players.get(client.sessionId);
                targetClient.send("voice-signal", {
                    type,
                    peerId: client.sessionId,
                    peerName: senderPlayer?.name ?? "Guest",
                    data: signalData
                });
            }
        });

        // Voice: Request to join voice channel
        this.onMessage("voice-join", (client) => {
            const player = this.state.players.get(client.sessionId);
            // Notify all other clients that this player wants to voice chat
            this.broadcast("voice-peer-joined", {
                id: client.sessionId,
                name: player?.name ?? "Guest"
            }, { except: client });
        });

        // Voice: Leave voice channel
        this.onMessage("voice-leave", (client) => {
            this.broadcast("voice-peer-left", {
                id: client.sessionId
            }, { except: client });
        });

        // ═══════════════════════════════════════════════════════════════════════════
        // 🖥️ SCREEN SHARE SIGNALING (WebRTC)
        // ═══════════════════════════════════════════════════════════════════════════

        this.onMessage("screen-signal", (client, data: { type: string; peerId: string; data: any }) => {
            const { type, peerId, data: signalData } = data;

            const targetClient = this.clients.find(c => c.sessionId === peerId);
            if (targetClient) {
                targetClient.send("screen-signal", {
                    type,
                    peerId: client.sessionId,
                    data: signalData
                });
            }
        });

        // Screen: Start sharing
        this.onMessage("screen-start", (client) => {
            const player = this.state.players.get(client.sessionId);

            // 1. Update State (Persisted)
            this.state.screen.active = true;
            this.state.screen.presenterId = client.sessionId;

            // Reset to default position on start (1m in front of 0,0,0 or similar default)
            this.state.screen.x = 0;
            this.state.screen.y = 1.5;
            this.state.screen.z = -1;
            this.state.screen.scale = 1.0;
            this.state.screen.rx = 0;
            this.state.screen.ry = 0;
            this.state.screen.rz = 0;

            console.log(`🖥️ Screen Share STARTED by ${player?.name}`);

            // 2. Broadcast for immediate UI feedback (optional but good for events)
            this.broadcast("screen-presenter", {
                id: client.sessionId,
                name: player?.name ?? "Guest"
            }, { except: client });
        });

        // Screen: Stop sharing
        this.onMessage("screen-stop", (client) => {
            // Validate: Only the presenter can stop it
            if (this.state.screen.presenterId !== client.sessionId && this.state.screen.active) {
                return;
            }

            this.state.screen.active = false;
            this.state.screen.presenterId = "";

            console.log(`🛑 Screen Share STOPPED`);

            this.broadcast("screen-ended", {
                id: client.sessionId
            }, { except: client });
        });

        // Screen: Update Transform (Move/Scale the screen)
        this.onMessage("screen-update-transform", (client, data: any) => {
            // Validate: Only current presenter can move it
            if (this.state.screen.presenterId !== client.sessionId) return;

            if (data.x !== undefined) this.state.screen.x = data.x;
            if (data.y !== undefined) this.state.screen.y = data.y;
            if (data.z !== undefined) this.state.screen.z = data.z;

            if (data.rx !== undefined) this.state.screen.rx = data.rx;
            if (data.ry !== undefined) this.state.screen.ry = data.ry;
            if (data.rz !== undefined) this.state.screen.rz = data.rz;

            if (data.scale !== undefined) this.state.screen.scale = data.scale;
        });
    }

    onJoin(client: Client, options: JoinOptions) {
        // 🔍 ISOLATION CHECK
        const targetSpaceId = (options as any).spaceId;
        if (targetSpaceId && targetSpaceId !== this.customRoomId) {
            console.error(`🚨 CRITICAL ISOLATION FAILURE! Room is '${this.customRoomId}' but Client wants '${targetSpaceId}'. They should NOT be here!`);
        } else {
            console.log(`🔒 Isolation Verified: Client wants '${targetSpaceId}' matches Room '${this.customRoomId}'`);
        }

        // ✅ first player sets the room environment (everyone else follows)
        if (this.state.players.size === 0) {
            const requested = (options?.envKey ?? "").toString();
            this.state.envKey = requested === "whitespace" ? "whitespace" : "office";
            console.log("🌍 envKey set to", this.state.envKey);
        }

        const p = new PlayerState();
        p.id = client.sessionId;
        p.name = (options?.name ?? "Guest").toString().slice(0, 32);
        p.avatarKey = (options?.avatarKey ?? "a1").toString();
        p.avatarUrl = (options?.avatarUrl ?? "").toString();

        p.x = 0;
        p.y = 1;     // ✅ 1 meter up
        p.z = -2;     // ✅ 2 meters “back” (we’ll treat +z as back)
        p.ry = Math.PI; // face toward origin (optional)

        this.state.players.set(client.sessionId, p);
        console.log("✅ MyRoom join", client.sessionId, options);
        console.log("👥 Active players:", this.state.players.keys());
    }

    async onLeave(client: Client, consented: boolean) {
        // ⚡ INSTANT REMOVAL
        console.log("👋 PREPARING TO REMOVE:", client.sessionId, "Consented:", consented);

        try {
            this.state.players.delete(client.sessionId);

            // 🛡️ FALLBACK: Broadcast explicit leave event in case Schema sync is lagging
            this.broadcast("player-left", { id: client.sessionId });

            console.log("🗑️ REMOVED from state:", client.sessionId);
        } catch (e) {
            console.error("❌ ERROR removing player:", e);
        }
    }
}
