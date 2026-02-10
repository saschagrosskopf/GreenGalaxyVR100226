/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎤 VOICE & SCREEN CONTROLS COMPONENT
 * Premium UI for voice chat and screen sharing in VR
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { voiceChatService, VoicePeer } from '../../services/VoiceChatService';
import { screenShareService } from '../../services/ScreenShareService';
import { colyseusService } from '../../services/colyseus/ColyseusService';

interface MediaControlsProps {
    isOpen: boolean;
    onToggle: () => void;
    accentColor?: string;
    userName: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
    mic: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    ),
    micOff: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    ),
    headphones: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
    ),
    headphonesOff: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 19a2 2 0 0 1-2 2h-1M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3" />
            <path d="M21 12v6M3 12v6" />
            <path d="M12 3a9 9 0 0 1 9 9" />
        </svg>
    ),
    screen: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    screenOff: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    settings: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    volume: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
    ),
    user: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎤 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const MediaControls: React.FC<MediaControlsProps> = ({
    isOpen,
    onToggle,
    accentColor = '#06B6D4',
    userName
}) => {
    // Voice state
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
    const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());

    // Screen share state
    const [isSharing, setIsSharing] = useState(false);
    const [currentPresenter, setCurrentPresenter] = useState<string | null>(null);

    // Loading states
    const [voiceLoading, setVoiceLoading] = useState(false);
    const [screenLoading, setScreenLoading] = useState(false);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔌 INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        // Setup voice chat callbacks
        voiceChatService.setCallbacks({
            onPeerJoined: (peerId, name) => {
                console.log('🎤 Voice peer joined:', name);
                setVoicePeers(voiceChatService.getPeers());
            },
            onPeerLeft: (peerId) => {
                console.log('🎤 Voice peer left:', peerId);
                setVoicePeers(voiceChatService.getPeers());
                setSpeakingPeers(prev => {
                    const next = new Set(prev);
                    next.delete(peerId);
                    return next;
                });
            },
            onPeerSpeaking: (peerId, isSpeaking) => {
                setSpeakingPeers(prev => {
                    const next = new Set(prev);
                    if (isSpeaking) next.add(peerId);
                    else next.delete(peerId);
                    return next;
                });
            },
            onError: (error) => {
                console.error('🎤 Voice error:', error);
            }
        });

        // Setup screen share callbacks
        screenShareService.setCallbacks({
            onStartSharing: () => {
                setIsSharing(true);
            },
            onStopSharing: () => {
                setIsSharing(false);
            },
            onRemoteShare: (peerId, stream) => {
                setCurrentPresenter(peerId);
            },
            onRemoteShareEnd: (peerId) => {
                if (currentPresenter === peerId) {
                    setCurrentPresenter(null);
                }
            },
            onError: (error) => {
                console.error('🖥️ Screen share error:', error);
            }
        });

        // Setup signaling through Colyseus
        // Note: These message handlers need to be added to your Colyseus room
        voiceChatService.setSignalHandler((type, peerId, data) => {
            // @ts-ignore - Send via Colyseus
            colyseusService.room?.send('voice-signal', { type, peerId, data });
        });

        screenShareService.setSignalHandler((type, peerId, data) => {
            // @ts-ignore
            colyseusService.room?.send('screen-signal', { type, peerId, data });
        });

        return () => {
            voiceChatService.disable();
            screenShareService.stopSharing();
        };
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎤 VOICE CONTROLS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleToggleVoice = useCallback(async () => {
        if (voiceEnabled) {
            voiceChatService.disable();
            setVoiceEnabled(false);
            setVoicePeers([]);
        } else {
            setVoiceLoading(true);
            const success = await voiceChatService.enable();
            setVoiceEnabled(success);
            setVoiceLoading(false);
        }
    }, [voiceEnabled]);

    const handleToggleMute = useCallback(() => {
        const muted = voiceChatService.toggleMute();
        setIsMuted(muted);
    }, []);

    const handleToggleDeafen = useCallback(() => {
        const deafened = voiceChatService.toggleDeafen();
        setIsDeafened(deafened);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🖥️ SCREEN SHARE CONTROLS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleToggleScreenShare = useCallback(async () => {
        try {
            if (isSharing) {
                screenShareService.stopSharing();
                colyseusService.sendScreenStop();
                setIsSharing(false);
            } else {
                setScreenLoading(true);
                const stream = await screenShareService.startSharing();
                if (stream) {
                    setIsSharing(true);
                    colyseusService.sendScreenStart();
                }
            }
        } catch (error) {
            console.error("❌ Toggle Screen Share Error:", error);
        } finally {
            setScreenLoading(false);
        }
    }, [isSharing]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    if (!isOpen) return null;

    return (
        <div className="fixed right-4 bottom-24 z-[10000] w-80">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl 
                          shadow-2xl shadow-black/50 overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: voiceEnabled ? '#10B981' : '#6B7280' }} />
                        <span className="text-white font-medium text-sm">Media Controls</span>
                    </div>
                    <button
                        onClick={onToggle}
                        className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center
                                 text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Main Controls */}
                <div className="p-4 space-y-4">

                    {/* Voice Chat Section */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Voice Chat
                        </div>

                        <div className="flex gap-2">
                            {/* Enable Voice Button */}
                            <button
                                onClick={handleToggleVoice}
                                disabled={voiceLoading}
                                className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2
                                          transition-all text-sm font-medium ${voiceEnabled
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {voiceLoading ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    voiceEnabled ? Icons.mic : Icons.micOff
                                )}
                                <span>{voiceEnabled ? 'Connected' : 'Join Voice'}</span>
                            </button>

                            {/* Mute Button */}
                            {voiceEnabled && (
                                <button
                                    onClick={handleToggleMute}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMuted
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                        }`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? Icons.micOff : Icons.mic}
                                </button>
                            )}

                            {/* Deafen Button */}
                            {voiceEnabled && (
                                <button
                                    onClick={handleToggleDeafen}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDeafened
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                        }`}
                                    title={isDeafened ? 'Undeafen' : 'Deafen'}
                                >
                                    {isDeafened ? Icons.headphonesOff : Icons.headphones}
                                </button>
                            )}
                        </div>

                        {/* Voice Peers List */}
                        {voiceEnabled && voicePeers.length > 0 && (
                            <div className="bg-black/20 rounded-xl p-2 space-y-1 max-h-32 overflow-y-auto">
                                {voicePeers.map(peer => (
                                    <div
                                        key={peer.id}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${speakingPeers.has(peer.id)
                                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                                            : 'bg-transparent'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white`}
                                            style={{ backgroundColor: accentColor }}>
                                            {Icons.user}
                                        </div>
                                        <span className="text-gray-300 flex-1">{peer.name}</span>
                                        {speakingPeers.has(peer.id) && (
                                            <div className="flex gap-0.5">
                                                <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                                <div className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                                                <div className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            </div>
                                        )}
                                        {peer.isMuted && (
                                            <span className="text-red-400">{Icons.micOff}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/5" />

                    {/* Screen Share Section */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Screen Share
                        </div>

                        <button
                            onClick={handleToggleScreenShare}
                            disabled={screenLoading}
                            className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2
                                      transition-all text-sm font-medium ${isSharing
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                }`}
                        >
                            {screenLoading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                isSharing ? Icons.screenOff : Icons.screen
                            )}
                            <span>{isSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                        </button>

                        {/* Presenter Info */}
                        {currentPresenter && !isSharing && (
                            <div className="flex items-center gap-2 p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-cyan-400">Someone is presenting</span>
                            </div>
                        )}

                        {isSharing && (
                            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs">
                                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-red-400">You are sharing your screen</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-white/5 bg-black/20">
                    <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span className="font-mono">WebRTC P2P</span>
                        <div className="flex items-center gap-1">
                            {Icons.settings}
                            <span>Settings</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaControls;
