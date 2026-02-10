
// src/services/realtime/MultiplayerService.ts
// @ts-ignore
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';
// @ts-ignore
import { db, getSessionId } from '../../logic';

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  avatarUrl?: string;
  lastSeen?: number;
}

type Listener = (players: PlayerState[]) => void;

class MultiplayerService {
  private myId: string;
  private listeners: Listener[] = [];
  private players: Map<string, PlayerState> = new Map();
  private unsubscribeSnapshot: (() => void) | null = null;
  private lastBroadcast = 0;

  constructor() {
    this.myId = getSessionId();
  }

  connect(name: string, color: string) {
    console.log("🔥 [Multiplayer] Connecting to Firestore as", name);

    // 1. Initialize Self immediately in local map
    this.updateMyPosition([0, 1.6, 5], [0, 0, 0], name, color);

    // 2. Start Realtime Listener
    try {
      const playersRef = collection(db, 'players');
      // FIX: Casting snapshot to any to bypass inference mismatch where docChanges is missing on expected type
      this.unsubscribeSnapshot = onSnapshot(playersRef, (snapshot: any) => {
        snapshot.docChanges().forEach((change: any) => {
          const data = change.doc.data() as any;
          const playerId = change.doc.id;

          // 3. Filter Own User
          if (playerId === this.myId) return;

          if (change.type === "added" || change.type === "modified") {
            const pState: PlayerState = {
              id: playerId,
              name: data.name || 'Anonymous',
              color: data.color || '#fff',
              position: data.position || [0, 0, 0],
              rotation: data.rotation || [0, 0, 0],
              avatarUrl: data.avatarUrl,
              lastSeen: data.lastSeen
            };
            this.players.set(playerId, pState);
          }

          if (change.type === "removed") {
            this.players.delete(playerId);
          }
        });

        this.notify();
      });
    } catch (e) {
      console.error("Firestore Connection Failed:", e);
    }
  }

  disconnect() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
    console.log("🔴 [Multiplayer] Disconnected");
  }

  updateMyPosition(pos: [number, number, number], rot: [number, number, number], name?: string, color?: string, avatarUrl?: string) {
    // 1. Update Local State (Immediate Feedback)
    const current = this.players.get(this.myId) || {
      id: this.myId,
      name: name || 'Anonymous',
      color: color || '#06B6D4',
      position: pos,
      rotation: rot,
      avatarUrl
    };

    current.position = pos;
    current.rotation = rot;
    if (name) current.name = name;
    if (color) current.color = color;
    if (avatarUrl) current.avatarUrl = avatarUrl;
    current.lastSeen = Date.now();

    this.players.set(this.myId, current);
    this.notify();

    // 2. Broadcast to DB (Throttled)
    const now = Date.now();
    if (now - this.lastBroadcast > 100) {
      this.lastBroadcast = now;
      this.syncToFirestore(current);
    }
  }

  private async syncToFirestore(state: PlayerState) {
    try {
      await setDoc(doc(db, 'players', this.myId), {
        name: state.name,
        color: state.color,
        position: state.position,
        rotation: state.rotation,
        avatarUrl: state.avatarUrl,
        lastSeen: Date.now()
      }, { merge: true });
    } catch (e) { }
  }

  subscribe(callback: Listener) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    const allPlayers = Array.from(this.players.values());
    this.listeners.forEach(cb => cb(allPlayers));
  }
}

export const multiplayer = new MultiplayerService();
