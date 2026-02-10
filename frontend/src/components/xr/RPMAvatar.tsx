/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧍 READY PLAYER ME AVATAR COMPONENT
 * Premium animated 3D avatars with emotes and name tags
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, RoundedBox, Billboard } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface RPMAvatarProps {
    sessionId: string;
    name: string;
    avatarUrl: string;
    position: [number, number, number];
    rotation: number;           // Y rotation in radians
    isSelf?: boolean;
    currentEmote?: string;      // Current emote state: 'idle', 'walk', 'wave', etc.
    chatMessage?: string;
    isTyping?: boolean;
    color?: string;             // Accent color for name tag
    onClick?: () => void;
    alwaysOnTop?: boolean;      // Force rendering on top of everything
}

// Default avatars - using 'local:' prefix to trigger geometric fallback rendering
export const DEFAULT_AVATARS: Record<string, string> = {
    'a1': '/assets/avatars/a1.glb',
    'a2': '/assets/avatars/a2.glb',
    'a3': '/assets/avatars/a3.glb',
    'default': '/assets/avatars/a1.glb'
};

// Global loader instance for caching
const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, GLTF>();

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 MAIN AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const RPMAvatar = React.forwardRef<THREE.Group, RPMAvatarProps>(({
    sessionId,
    name,
    avatarUrl,
    position,
    rotation,
    isSelf = false,
    currentEmote = 'idle',
    chatMessage,
    isTyping = false,
    color = '#06B6D4',
    onClick,
    alwaysOnTop = false
}, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    React.useImperativeHandle(ref, () => groupRef.current!);

    const [gltf, setGltf] = useState<GLTF | null>(null);
    const [modelError, setModelError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 🎭 ANIMATION STATE
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
    const activeActionRef = useRef<THREE.AnimationAction | null>(null);

    // Resolve avatar URL
    const resolvedUrl = useMemo(() => {
        if (avatarUrl?.startsWith('http')) return avatarUrl;
        if (avatarUrl?.startsWith('/')) return avatarUrl;
        const resolved = DEFAULT_AVATARS[avatarUrl] || DEFAULT_AVATARS['default'];
        return resolved;
    }, [avatarUrl]);

    // Load Model
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        setModelError(false);

        // Check cache
        if (modelCache.has(resolvedUrl)) {
            setGltf(modelCache.get(resolvedUrl)!);
            setIsLoading(false);
            return;
        }

        // Load Mesh
        console.log(`🧍 [${sessionId}] RPMAvatar: Initializing load from: ${resolvedUrl}`);
        gltfLoader.load(resolvedUrl, (loadedGltf) => {
            if (!isMounted) return;
            console.log(`✅ [${sessionId}] RPMAvatar: Model mesh loaded.`);
            modelCache.set(resolvedUrl, loadedGltf);
            setGltf(loadedGltf);
            setIsLoading(false);
        }, undefined, (err) => {
            console.error(`❌ [${sessionId}] RPMAvatar: Model load failed:`, err);
            if (isMounted) {
                setModelError(true);
                setIsLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, [resolvedUrl, sessionId]);

    // Clone the scene
    const clonedScene = useMemo(() => {
        if (!gltf?.scene) return null;
        const clone = SkeletonUtils.clone(gltf.scene) as THREE.Group;
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.SkinnedMesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = false;
            }
        });
        clone.updateMatrixWorld(true);
        return clone;
    }, [gltf?.scene]);

    // 🎭 ANIMATION SETUP
    useEffect(() => {
        if (!clonedScene) return;

        const mixer = new THREE.AnimationMixer(clonedScene);
        mixerRef.current = mixer;

        // Load external animations
        const animFiles = ['Idle', 'Walk', 'Wave'];
        animFiles.forEach(filename => {
            gltfLoader.load(`/assets/avatars/${filename}.glb`, (animGltf) => {
                const clip = animGltf.animations[0];
                if (clip) {
                    const name = filename.toLowerCase();
                    const action = mixer.clipAction(clip);
                    actionsRef.current[name] = action;

                    // Start default animation
                    if (name === 'idle' && !activeActionRef.current) {
                        action.play();
                        activeActionRef.current = action;
                    }
                }
            });
        });

        return () => {
            mixer.stopAllAction();
            mixerRef.current = null;
        };
    }, [clonedScene]);

    // 🔄 ANIMATION UPDATE LOOP
    useFrame((_, delta) => {
        if (mixerRef.current) mixerRef.current.update(delta);
    });

    // 📣 EMOTE/STATE TRANSITION
    // 🔒 LOCK STATE
    // Prevents one-shot animations (like wave) from being interrupted by default state updates
    const locked = useRef(false);

    // 📣 EMOTE/STATE TRANSITION
    useEffect(() => {
        const emoteName = (currentEmote || 'idle').toLowerCase();
        const nextAction = actionsRef.current[emoteName];

        if (!nextAction) return;

        // 1. If we are LOCKED, we ignore "idle" or "walk" requests.
        // We only allow "wave" (replay) or other explicit emotes to override if necessary, 
        // but for now, we'll treat lock as absolute for base states.
        const isRequestingBaseState = emoteName === 'idle' || emoteName === 'walk';
        if (locked.current && isRequestingBaseState) {
            console.log(`🛡️ [${sessionId}] Locked! Ignoring request for: ${emoteName}`);
            return;
        }

        // Optimization: if it's the exact same action and it's looping, don't restart it
        if (nextAction === activeActionRef.current && emoteName !== 'wave') return;

        console.log(`🎭 [${sessionId}] State shift: ${emoteName}`);
        const prevAction = activeActionRef.current;

        if (emoteName === 'wave') {
            // LOCK THE ANIMATION SYSTEM
            locked.current = true;

            // One-shot emote
            nextAction.reset()
                .setLoop(THREE.LoopOnce, 1)
                .fadeIn(0.2)
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .play();

            // Fade out previous (idle/walk)
            if (prevAction) prevAction.fadeOut(0.2);
            activeActionRef.current = nextAction;

            // Return to idle/walk when done
            const onFinished = (e: any) => {
                if (e.action === nextAction) {
                    console.log(`🎭 [${sessionId}] Emote finished. Unlocking.`);
                    locked.current = false;

                    // Force a re-evaluation or manually transition to idle
                    // Since we ignored the props while locked, we should now adopt the logical base state.
                    const returnToName = 'idle';
                    const returnTo = actionsRef.current[returnToName] || actionsRef.current['walk'];

                    if (returnTo) {
                        nextAction.fadeOut(0.2);
                        returnTo.reset().fadeIn(0.2).play();
                        activeActionRef.current = returnTo;
                    }
                    mixerRef.current?.removeEventListener('finished', onFinished);
                }
            };
            mixerRef.current?.addEventListener('finished', onFinished);

        } else {
            // Persistent loop (idle, walk)
            nextAction.reset().fadeIn(0.2).play();
            if (prevAction) prevAction.fadeOut(0.2);
            activeActionRef.current = nextAction;

            // Ensure we are unlocked if we manually switched to a loop (e.g. forced override)
            locked.current = false;
        }

        return () => {
            // If we unmount or switch rapidly, cleanup listeners?
            // Ideally we should remove the specific listener if we are switching away from Wave
            // but `locked` logic handles most cases.
        };
    }, [currentEmote, sessionId]);

    // Rendering logic
    if (isLoading) return <group position={position} ref={groupRef}><mesh position={[0, 0.9, 0]}><capsuleGeometry args={[0.25, 0.7, 8]} /><meshStandardMaterial color={color} transparent opacity={0.5} /></mesh></group>;
    if (modelError || !clonedScene) return <group position={position} ref={groupRef} rotation={[0, rotation, 0]}><mesh position={[0, 0.9, 0]}><capsuleGeometry args={[0.3, 0.8, 12]} /><meshStandardMaterial color={color} /></mesh><NameTag name={name} color={color} position={[0, 2.1, 0]} /></group>;

    return (
        <group ref={groupRef} position={position} rotation={[0, rotation, 0]} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            <primitive object={clonedScene} position={[0, 0, 0]} />
            <NameTag name={name} color={color} position={[0, 2.1, 0]} isTyping={isTyping} />
            {chatMessage && <ChatBubble message={chatMessage} position={[0, 2.5, 0]} color={color} />}
        </group>
    );
});

// NameTag and ChatBubble below... (omitted for brevity in this rewrite, but I'll write the full file)

interface NameTagProps {
    name: string;
    color: string;
    position: [number, number, number];
    isTyping?: boolean;
}

export const NameTag: React.FC<NameTagProps> = ({ name, color, position, isTyping }) => {
    // Premium accent color (purpleish/indigo if none provided)
    const accentColor = color || '#6366f1';
    const padding = 0.2;
    const width = name.length * 0.08 + padding * 2;
    const height = 0.26;

    return (
        <Billboard position={position} follow={true}>
            <group>
                {/* 1. GLASS PANEL BACKGROUND */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[width, height]} />
                    <meshStandardMaterial
                        color="#0f172a"
                        transparent
                        opacity={0.8}
                        roughness={0.1}
                        metalness={0.8}
                    />
                </mesh>

                {/* 2. VIBRANT ACCENT BORDER (Purpleish Glow) */}
                <mesh position={[0, 0, -0.012]}>
                    <planeGeometry args={[width + 0.04, height + 0.04]} />
                    <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
                </mesh>

                {/* 3. OPTIONAL GLOW LAYER */}
                <mesh position={[0, 0, -0.015]}>
                    <planeGeometry args={[width + 0.1, height + 0.1]} />
                    <meshBasicMaterial color={accentColor} transparent opacity={0.2} />
                </mesh>

                {/* 4. TEXT CONTENT */}
                <Text
                    fontSize={0.11}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="black"
                    letterSpacing={0.05}
                    position={[0, 0, 0]}
                >
                    {name.toUpperCase()}
                </Text>

                {isTyping && <group position={[width / 2 - 0.1, 0, 0]}><TypingIndicator /></group>}
            </group>
        </Billboard>
    );
};

const TypingIndicator: React.FC = () => {
    const [dots, setDots] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setDots(d => (d + 1) % 4), 400);
        return () => clearInterval(interval);
    }, []);
    return <Text fontSize={0.1} color="#06B6D4" anchorX="left" anchorY="middle">{'.'.repeat(dots)}</Text>;
};

export const ChatBubble: React.FC<{ message: string; position: [number, number, number]; color?: string }> = ({ message, position, color = '#6366f1' }) => {
    const [show, setShow] = useState(true);
    useEffect(() => { setShow(true); const t = setTimeout(() => setShow(false), 8000); return () => clearTimeout(t); }, [message]);
    if (!show) return null;
    return (
        <group position={position}>
            <Html center distanceFactor={8} style={{ pointerEvents: 'none', transform: 'translateY(-100%)' }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: `2px solid ${color}`,
                    borderRadius: '16px',
                    padding: '10px 18px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 10px 30px -10px ${color}44`,
                    maxWidth: '250px',
                    textAlign: 'center'
                }}>
                    {message}
                </div>
                <div style={{
                    width: 0, height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: `10px solid ${color}`,
                    margin: '0 auto',
                    filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))'
                }} />
            </Html>
        </group>
    );
};

export default RPMAvatar;
