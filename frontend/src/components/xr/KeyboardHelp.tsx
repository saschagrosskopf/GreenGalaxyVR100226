/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⌨️ KEYBOARD SHORTCUTS HELP OVERLAY
 * Shows all available keyboard shortcuts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';

interface KeyboardHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ShortcutCategory {
    name: string;
    icon: string;
    shortcuts: { key: string; description: string }[];
}

const SHORTCUTS: ShortcutCategory[] = [
    {
        name: 'Movement',
        icon: '🎮',
        shortcuts: [
            { key: 'W / ↑', description: 'Move forward' },
            { key: 'S / ↓', description: 'Move backward' },
            { key: 'A / ←', description: 'Move left' },
            { key: 'D / →', description: 'Move right' },
            { key: 'Space', description: 'Jump (if enabled)' },
            { key: 'Shift', description: 'Sprint' },
            { key: 'Mouse', description: 'Look around' },
        ]
    },
    {
        name: 'Communication',
        icon: '💬',
        shortcuts: [
            { key: 'Enter', description: 'Open/close chat' },
            { key: 'E', description: 'Open emotes panel' },
            { key: 'V', description: 'Toggle voice chat' },
            { key: 'M', description: 'Mute/unmute microphone' },
        ]
    },
    {
        name: 'Tools',
        icon: '🛠️',
        shortcuts: [
            { key: '1', description: 'Select tool' },
            { key: '2', description: 'Sticky note' },
            { key: '3', description: 'Shape' },
            { key: '4', description: 'Text' },
            { key: 'N', description: 'New sticky note' },
            { key: 'Del', description: 'Delete selected' },
        ]
    },
    {
        name: 'System',
        icon: '⚙️',
        shortcuts: [
            { key: 'Escape', description: 'Exit fullscreen / Exit VR' },
            { key: 'F', description: 'Toggle fullscreen' },
            { key: 'G', description: 'Open AI Architect' },
            { key: 'P', description: 'Toggle player list' },
            { key: '?', description: 'Show this help' },
        ]
    }
];

export const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ isOpen, onClose }) => {
    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl 
                          w-[800px] max-h-[80vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 
                              bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 
                                      rounded-xl flex items-center justify-center text-xl">
                            ⌨️
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                            <p className="text-sm text-gray-400">Quick reference guide</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center
                                 text-gray-400 hover:text-white transition-colors text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-2 gap-8">
                        {SHORTCUTS.map((category) => (
                            <div key={category.name}>
                                {/* Category Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xl">{category.icon}</span>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        {category.name}
                                    </h3>
                                </div>

                                {/* Shortcuts */}
                                <div className="space-y-2">
                                    {category.shortcuts.map((shortcut, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between py-2 px-3 
                                                     bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-gray-300 text-sm">{shortcut.description}</span>
                                            <kbd className="px-2.5 py-1 bg-slate-800 border border-white/10 
                                                          rounded-md text-xs font-mono text-cyan-400">
                                                {shortcut.key}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-gray-400">?</kbd> anytime to show this help
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KeyboardHelp;
