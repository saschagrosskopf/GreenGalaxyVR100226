/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🥽 VR MODE BUTTON COMPONENT
 * Premium Enter VR button with device detection
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { webXRManager } from '../../services/WebXRManager';

interface VRButtonProps {
    onEnterVR?: () => void;
    onExitVR?: () => void;
    accentColor?: string;
}

export const VRButton: React.FC<VRButtonProps> = ({
    onEnterVR,
    onExitVR,
    accentColor = '#06B6D4'
}) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [headsetType, setHeadsetType] = useState<string | null>(null);

    useEffect(() => {
        // Check WebXR support on mount
        const checkSupport = async () => {
            const supported = await webXRManager.checkSupport();
            setIsSupported(supported);
            setIsLoading(false);

            if (supported) {
                const state = webXRManager.getState();
                setHeadsetType(state.headsetType);
            }
        };

        checkSupport();

        // Setup XR callbacks
        webXRManager.setCallbacks({
            onSessionStart: () => {
                setIsActive(true);
                onEnterVR?.();
            },
            onSessionEnd: () => {
                setIsActive(false);
                onExitVR?.();
            }
        });
    }, [onEnterVR, onExitVR]);

    const handleClick = async () => {
        if (isActive) {
            await webXRManager.endSession();
        } else {
            setIsLoading(true);
            const success = await webXRManager.startVRSession();
            setIsLoading(false);

            if (!success) {
                console.error('Failed to enter VR mode');
            }
        }
    };

    // Not supported - show disabled state
    if (!isSupported && !isLoading) {
        return (
            <button
                disabled
                className="fixed right-4 top-4 z-[10000] px-4 py-2.5 
                         bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl
                         flex items-center gap-2 cursor-not-allowed opacity-60"
                title="VR not supported in this browser"
            >
                <VRIcon />
                <span className="text-gray-500 text-sm font-medium">VR Not Supported</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`fixed right-4 top-4 z-[10000] px-5 py-3 
                       backdrop-blur-xl border rounded-xl
                       flex items-center gap-3 transition-all duration-300
                       hover:scale-105 active:scale-95
                       ${isActive
                    ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/90 border-white/10 hover:border-white/20'
                }`}
            style={{
                boxShadow: isActive ? `0 0 30px ${accentColor}30` : undefined
            }}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
                <VRIcon active={isActive} />
            )}

            <div className="flex flex-col items-start">
                <span className={`text-sm font-bold ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                    {isLoading ? 'Loading...' : isActive ? 'Exit VR' : 'Enter VR'}
                </span>
                {headsetType && !isLoading && (
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {headsetType}
                    </span>
                )}
            </div>

            {/* Animated glow for active state */}
            {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 
                              animate-pulse pointer-events-none" />
            )}
        </button>
    );
};

// VR Headset Icon
const VRIcon: React.FC<{ active?: boolean }> = ({ active = false }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#06B6D4' : 'currentColor'}
        strokeWidth="1.5"
        className={active ? 'text-cyan-400' : 'text-gray-300'}
    >
        {/* Headset body */}
        <path d="M3 10.5C3 8 5 6 7.5 6h9C19 6 21 8 21 10.5v3c0 2.5-2 4.5-4.5 4.5H16l-1 2h-6l-1-2H7.5C5 18 3 16 3 13.5v-3z" />
        {/* Left lens */}
        <circle cx="8" cy="12" r="2" />
        {/* Right lens */}
        <circle cx="16" cy="12" r="2" />
        {/* Nose bridge */}
        <path d="M10 12h4" />
        {/* Strap */}
        <path d="M3 11H1M23 11h-2" />
    </svg>
);

export default VRButton;
