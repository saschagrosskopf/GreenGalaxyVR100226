/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 💬 VR CHAT SYSTEM
 * Enterprise-grade real-time chat for immersive collaboration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { colyseusService, ChatMessage } from '../../services/colyseus/ColyseusService';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface VRChatProps {
    isOpen: boolean;
    onToggle: () => void;
    accentColor?: string;
    userName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💬 MAIN CHAT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const VRChat: React.FC<VRChatProps> = ({
    isOpen,
    onToggle,
    accentColor = '#06B6D4',
    userName = 'You'
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Subscribe to chat messages
    useEffect(() => {
        console.log('💬 Setting up chat subscription...');

        const handleChatMessage = (message: ChatMessage) => {
            console.log('💬 Received chat message:', message);
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.ts === message.ts && m.text === message.text && m.name === message.name)) {
                    return prev;
                }
                return [...prev.slice(-50), message];
            });
        };

        colyseusService.setOnChat(handleChatMessage);

        return () => {
            colyseusService.setOnChat(() => { });
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        // Typing indicator logic
        if (!isTyping) {
            setIsTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1000);
    };

    // Send message with local echo
    const handleSend = useCallback(() => {
        const text = inputValue.trim();
        if (!text) return;

        // Local echo - add message immediately for instant feedback
        const localMessage: ChatMessage = {
            id: colyseusService.getSessionId() || 'local',
            name: userName,
            text: text,
            ts: Date.now()
        };

        setMessages(prev => [...prev.slice(-50), localMessage]);
        colyseusService.sendChat(text);
        setInputValue('');
        setIsTyping(false);
    }, [inputValue, userName]);

    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === 'Escape') {
            onToggle();
        }
    };

    // Format timestamp
    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[10000] w-[380px] h-[500px]
            bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl
            flex flex-col shadow-2xl overflow-hidden"
            style={{ boxShadow: `0 0 60px ${accentColor}20` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
                style={{ background: `linear-gradient(135deg, ${accentColor}15, transparent)` }}>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: accentColor }} />
                    <h3 className="text-white font-semibold text-sm tracking-wide">
                        TEAM CHAT
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono">
                        LIVE
                    </span>
                </div>
                <button
                    onClick={onToggle}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10
                        flex items-center justify-center text-gray-400 hover:text-white
                        transition-all"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-4xl mb-3 opacity-50">💬</div>
                        <p className="text-gray-500 text-sm">No messages yet</p>
                        <p className="text-gray-600 text-xs mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.name === userName;
                        return (
                            <div
                                key={`${msg.ts}-${idx}`}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isMe ? 'order-2' : ''}`}>
                                    {/* Sender name (not for self) */}
                                    {!isMe && (
                                        <div className="text-[10px] text-gray-500 mb-1 px-1 font-medium">
                                            {msg.name}
                                        </div>
                                    )}
                                    {/* Message bubble */}
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm ${isMe
                                            ? 'rounded-br-md text-white'
                                            : 'bg-white/10 text-gray-200 rounded-bl-md'
                                            }`}
                                        style={isMe ? { backgroundColor: accentColor } : {}}
                                    >
                                        {msg.text}
                                    </div>
                                    {/* Timestamp */}
                                    <div className={`text-[9px] text-gray-600 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'
                                        }`}>
                                        {formatTime(msg.ts)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2
                    border border-white/5 focus-within:border-cyan-500/50 transition-colors">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-white text-sm
                            placeholder-gray-500 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="w-9 h-9 rounded-lg flex items-center justify-center
                            text-white disabled:opacity-30 disabled:cursor-not-allowed
                            hover:scale-110 transition-all"
                        style={{ backgroundColor: inputValue.trim() ? accentColor : 'transparent' }}
                    >
                        ➤
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-[10px] text-gray-600">
                        Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Enter</kbd> to send
                    </span>
                    <span className="text-[10px] text-gray-600">
                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Esc</kbd> to close
                    </span>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 EMOTES PANEL
// ═══════════════════════════════════════════════════════════════════════════════

interface EmotesPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    onEmote: (emote: string) => void;
    accentColor?: string;
}

export const EmotesPanel: React.FC<EmotesPanelProps> = ({
    isOpen,
    onToggle,
    onEmote,
    accentColor = '#06B6D4'
}) => {
    const emotes = [
        { id: 'wave', emoji: '👋', label: 'Wave' },
        { id: 'clap', emoji: '👏', label: 'Clap' },
        { id: 'dance', emoji: '💃', label: 'Dance' },
        { id: 'thumbsup', emoji: '👍', label: 'Thumbs Up' },
        { id: 'thinking', emoji: '🤔', label: 'Thinking' },
        { id: 'celebrate', emoji: '🎉', label: 'Celebrate' },
    ];

    const handleEmote = (emoteId: string) => {
        colyseusService.sendEmote(emoteId);
        onEmote(emoteId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-24 z-[10000]
            bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl
            p-3 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-white text-xs font-semibold tracking-wide">EMOTES</span>
                <button onClick={onToggle} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {emotes.map((emote) => (
                    <button
                        key={emote.id}
                        onClick={() => handleEmote(emote.id)}
                        className="w-14 h-14 rounded-xl bg-white/5 hover:bg-white/15
                            flex flex-col items-center justify-center gap-1
                            transition-all hover:scale-110 group"
                    >
                        <span className="text-2xl group-hover:animate-bounce">{emote.emoji}</span>
                        <span className="text-[8px] text-gray-500 group-hover:text-white">
                            {emote.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VRChat;
