import { useState, useEffect, useCallback, useRef } from 'react';
import { colyseusService, PlayerState, ChatMessage, EmoteEvent } from '../services/colyseus/ColyseusService';
import { getSessionId } from '../logic';
import { VR_SAFETY_LIMITS } from '../services/security';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MultiplayerState {
    players: Map<string, PlayerState>;
    localPlayerId: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

export interface UseMultiplayerResult {
    players: PlayerState[];         // Array version for UI mapping
    otherPlayers: PlayerState[];    // Filtered array
    localPlayerId: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    chatMessages: ChatMessage[];
    activeEmotes: Map<string, string>;
    state: MultiplayerState;        // Full state object for legacy UI access
    connect: () => Promise<boolean>;
    disconnect: () => void;
    sendPosition: (x: number, y: number, z: number, ry: number, isMoving: boolean) => void;
    sendChat: (text: string) => void;
    sendEmote: (emote: string) => void;
}

/**
 * Hook to interface with Colyseus multiplayer
 */
export const useMultiplayer = (
    roomId: string,
    userName: string,
    avatarKey: string,
    avatarUrl: string,
    environment: string,
    onPlayerJoin?: (player: PlayerState) => void,
    onPlayerLeave?: (playerId: string) => void,
    onChat?: (message: ChatMessage) => void,
    onEmote?: (event: EmoteEvent) => void
): UseMultiplayerResult => {
    const [state, setState] = useState<MultiplayerState>({
        players: new Map<string, PlayerState>(),
        localPlayerId: null as string | null,
        isConnected: false,
        isConnecting: false,
        error: null as string | null
    });

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [activeEmotes, setActiveEmotes] = useState<Map<string, string>>(new Map());
    const lastSendTime = useRef(0);

    const connect = useCallback(async (): Promise<boolean> => {
        if (state.isConnecting || state.isConnected) return state.isConnected;

        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const success = await colyseusService.joinRoom(roomId, {
                name: userName,
                avatarKey,
                avatarUrl,
                envKey: environment
            });

            if (success) {
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    isConnecting: false,
                    localPlayerId: colyseusService.getSessionId()
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    isConnecting: false,
                    error: 'Failed to join room'
                }));
            }

            return success;
        } catch (error) {
            console.error('❌ Multiplayer connection error:', error);
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error instanceof Error ? error.message : 'Connection failed'
            }));
            return false;
        }
    }, [roomId, userName, avatarKey, avatarUrl, environment, state.isConnecting, state.isConnected]);

    const disconnect = useCallback(async () => {
        await colyseusService.leaveRoom();
        setState(prev => ({
            ...prev,
            isConnected: false,
            players: new Map(),
            localPlayerId: null,
            error: null,
            isConnecting: false
        }));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        // Player join
        colyseusService.setOnPlayerJoin((player: PlayerState) => {
            console.log('🪝 Hook: onPlayerJoin', player.id, player.name);
            setState(prev => {
                const newPlayers = new Map(prev.players);
                newPlayers.set(player.id, player);
                return { ...prev, players: newPlayers };
            });
            onPlayerJoin?.(player);
        });

        // Player leave
        colyseusService.setOnPlayerLeave((playerId: string) => {
            setState(prev => {
                const newPlayers = new Map(prev.players);
                newPlayers.delete(playerId);
                return { ...prev, players: newPlayers };
            });
            setActiveEmotes(prev => {
                const next = new Map(prev);
                next.delete(playerId);
                return next;
            });
            onPlayerLeave?.(playerId);
        });

        // Player move
        colyseusService.setOnPlayerMove((player: PlayerState) => {
            setState(prev => {
                const newPlayers = new Map(prev.players);
                newPlayers.set(player.id, player);
                return { ...prev, players: newPlayers };
            });
        });

        // Chat
        colyseusService.setOnChat((message: ChatMessage) => {
            setChatMessages(prev => [...prev.slice(-100), message]);
            onChat?.(message);
        });

        // Emotes
        colyseusService.setOnEmote((event: EmoteEvent) => {
            setActiveEmotes(prev => {
                const next = new Map(prev);
                next.set(event.id, event.emote);
                return next;
            });

            setTimeout(() => {
                setActiveEmotes(prev => {
                    const next = new Map(prev);
                    if (next.get(event.id) === event.emote) {
                        next.delete(event.id);
                    }
                    return next;
                });
            }, 3000);

            onEmote?.(event);
        });

        // Connection change
        colyseusService.setOnConnectionChange((connected: boolean) => {
            setState(prev => ({
                ...prev,
                isConnected: connected,
                localPlayerId: connected ? colyseusService.getSessionId() : null
            }));
        });

        // 🛡️ HANDLE BROWSER REFRESH / CLOSE
        const handleUnload = () => {
            colyseusService.leaveRoom();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            colyseusService.setOnPlayerJoin(() => { });
            colyseusService.setOnPlayerLeave(() => { });
            colyseusService.setOnPlayerMove(() => { });
            colyseusService.setOnChat(() => { });
            colyseusService.setOnEmote(() => { });
            colyseusService.setOnConnectionChange(() => { });

            // Allow component unmount to trigger leave as well if still connected
            // (Strictly speaking, `disconnect` function handles state, but `colyseusService.leaveRoom` handles the socket)
            // We rely on the parent component calling `disconnect()` or this unmount logic.
            // If the component unmounts without explicit disconnect, we should probably leave.
            // But `disconnect` is exposed to parent. Let's force it here too just in case.
            // colyseusService.leaveRoom(); // Commented out to blindly trust parent or explicit disconnect, 
            // but for safety in dev:
            // colyseusService.leaveRoom(); 
        };
    }, [onPlayerJoin, onPlayerLeave, onChat, onEmote]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    const sendPosition = useCallback((x: number, y: number, z: number, ry: number, isMoving: boolean) => {
        const now = performance.now();
        if (now - lastSendTime.current < (VR_SAFETY_LIMITS.POSITION_SYNC_INTERVAL || 50)) return;
        lastSendTime.current = now;

        if (state.isConnected) {
            colyseusService.sendPosition(x, y, z, ry, isMoving);
        }
    }, [state.isConnected]);

    const sendChat = useCallback((text: string) => {
        if (state.isConnected) colyseusService.sendChat(text);
    }, [state.isConnected]);

    const sendEmote = useCallback((emote: string) => {
        if (state.isConnected) colyseusService.sendEmote(emote);
    }, [state.isConnected]);

    // Pre-calculate array version
    const playersArray = Array.from(state.players.values());

    return {
        players: playersArray,
        otherPlayers: playersArray.filter(p => p.id !== state.localPlayerId),
        localPlayerId: state.localPlayerId,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        chatMessages,
        activeEmotes,
        state: state, // REQUIRED: Return the full state object for UI dashboard
        connect,
        disconnect,
        sendPosition,
        sendChat,
        sendEmote
    };
};
