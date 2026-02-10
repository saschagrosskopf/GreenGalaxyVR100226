/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 👥 PLAYER LIST COMPONENT
 * Shows online players with status indicators
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';

interface Player {
    id: string;
    name: string;
    avatarUrl?: string;
    isVoiceActive?: boolean;
    isSpeaking?: boolean;
    isPresenting?: boolean;
}

interface PlayerListProps {
    players: Player[];
    localPlayerId: string | null;
    onPlayerClick?: (playerId: string) => void;
    onMutePlayer?: (playerId: string) => void;
    accentColor?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
    mic: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
    ),
    micOff: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
        </svg>
    ),
    screen: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    crown: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
        </svg>
    ),
    volume: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
    ),
    moreVertical: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
        </svg>
    )
};

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PlayerList: React.FC<PlayerListProps> = ({
    players,
    localPlayerId,
    onPlayerClick,
    onMutePlayer,
    accentColor = '#06B6D4'
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

    // Sort: local player first, then by speaking, then by name
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.id === localPlayerId) return -1;
        if (b.id === localPlayerId) return 1;
        if (a.isSpeaking && !b.isSpeaking) return -1;
        if (!a.isSpeaking && b.isSpeaking) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="fixed left-4 top-20 z-[9999] w-64">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 
                         bg-slate-900/90 backdrop-blur-xl border border-white/10 
                         rounded-t-xl hover:bg-slate-800/90 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-medium text-sm">Players</span>
                    <span className="text-gray-500 text-xs">({players.length})</span>
                </div>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Player List */}
            {isExpanded && (
                <div className="bg-slate-900/90 backdrop-blur-xl border border-t-0 border-white/10 
                              rounded-b-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                    {sortedPlayers.map((player) => {
                        const isLocal = player.id === localPlayerId;
                        const isHovered = hoveredPlayer === player.id;

                        return (
                            <div
                                key={player.id}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer
                                          transition-all border-l-2 ${isLocal
                                        ? 'bg-cyan-500/10 border-cyan-500'
                                        : player.isSpeaking
                                            ? 'bg-emerald-500/10 border-emerald-500'
                                            : 'border-transparent hover:bg-white/5'
                                    }`}
                                onClick={() => onPlayerClick?.(player.id)}
                                onMouseEnter={() => setHoveredPlayer(player.id)}
                                onMouseLeave={() => setHoveredPlayer(null)}
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                        style={{
                                            backgroundColor: isLocal ? accentColor : '#4f46e5',
                                            border: player.isSpeaking ? '2px solid #10B981' : 'none'
                                        }}
                                    >
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Voice indicator */}
                                    {player.isSpeaking && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full 
                                                      flex items-center justify-center border border-slate-900">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                        </div>
                                    )}
                                </div>

                                {/* Name & Status */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm truncate ${isLocal ? 'text-cyan-400 font-medium' : 'text-gray-300'}`}>
                                            {player.name}
                                        </span>
                                        {isLocal && (
                                            <span className="text-[10px] text-cyan-400/60 uppercase">(you)</span>
                                        )}
                                    </div>

                                    {/* Status icons */}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {player.isVoiceActive && (
                                            <span className="text-emerald-400" title="In voice chat">
                                                {Icons.mic}
                                            </span>
                                        )}
                                        {player.isPresenting && (
                                            <span className="text-purple-400" title="Presenting">
                                                {Icons.screen}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {!isLocal && isHovered && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMutePlayer?.(player.id);
                                            }}
                                            className="w-6 h-6 rounded flex items-center justify-center 
                                                     text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Mute player"
                                        >
                                            {Icons.volume}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {players.length === 0 && (
                        <div className="px-4 py-6 text-center">
                            <span className="text-gray-500 text-sm">No players online</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerList;
