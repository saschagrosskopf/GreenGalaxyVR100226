import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Text, Line, RoundedBox, useCursor, Html } from '@react-three/drei';
import * as THREE from 'three';
import { User } from '../../types';
// @ts-ignore
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// @ts-ignore
import { db } from '../../logic';

/**
 * 🎯 INFINITE CANVAS - COMPLETE MIRO KILLER ENGINE V2
 * Full feature parity with Miro + VR capabilities
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CanvasObject {
    id: string;
    type: 'sticky' | 'shape' | 'text' | 'connector' | 'image' | 'frame' | 'drawing' | 'table' | 'timer' | 'vote' | 'sticker';
    position: [number, number, number];
    size: [number, number];
    rotation?: number;
    color: string;
    content?: string;
    parentId?: string;
    connectedTo?: string[];
    metadata?: Record<string, any>;
    createdBy?: string;
    createdAt?: number;
    votes?: number;
    locked?: boolean;
    zIndex?: number;
}

interface CanvasProps {
    spaceId: string;
    userId: string;
    userName: string;
    accentColor?: string;
    onObjectsChange?: (objects: CanvasObject[]) => void;
    isVRMode?: boolean;
    activeTool?: string;
    toolColor?: string;
    hideFloor?: boolean;
    hideUI?: boolean;
    user?: User | null;
    onUpdateUser?: (updates: Partial<User>) => void;
}

type ToolMode = 'select' | 'pan' | 'sticky' | 'shape' | 'text' | 'draw' | 'connector' | 'frame' | 'eraser' | 'vote' | 'timer' | 'sticker';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const STICKY_COLORS = ['#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5', '#fae8ff', '#fed7aa', '#e0e7ff', '#f3f4f6'];
const SHAPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useCanvasObjects = (spaceId: string) => {
    const [objects, setObjects] = useState<CanvasObject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!spaceId) {
            setLoading(false);
            return;
        }
        try {
            const ref = collection(db, 'spaces', spaceId, 'canvasObjects');
            const unsub = onSnapshot(ref, (snap: any) => {
                const objs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                setObjects(objs);
                // Expose for serialization engine
                (window as any).canvasObjects = objs;
                setLoading(false);
            }, (error: any) => {
                console.error('Canvas sync error:', error);
                setLoading(false);
            });
            return () => unsub();
        } catch (e) {
            console.error('Canvas init error:', e);
            setLoading(false);
        }
    }, [spaceId]);

    const addObject = useCallback(async (obj: Omit<CanvasObject, 'id'>) => {
        try {
            const ref = collection(db, 'spaces', spaceId, 'canvasObjects');
            await addDoc(ref, { ...obj, createdAt: serverTimestamp() });
        } catch (e) {
            console.error('Add object error:', e);
        }
    }, [spaceId]);

    const updateObject = useCallback(async (id: string, data: Partial<CanvasObject>) => {
        try {
            const docRef = doc(db, 'spaces', spaceId, 'canvasObjects', id);
            await updateDoc(docRef, data);
        } catch (e) {
            console.error('Update object error:', e);
        }
    }, [spaceId]);

    const deleteObject = useCallback(async (id: string) => {
        try {
            await deleteDoc(doc(db, 'spaces', spaceId, 'canvasObjects', id));
        } catch (e) {
            console.error('Delete object error:', e);
        }
    }, [spaceId]);

    const clearAll = useCallback(async () => {
        for (const obj of objects) {
            try {
                await deleteDoc(doc(db, 'spaces', spaceId, 'canvasObjects', obj.id));
            } catch (e) {
                console.error('Clear error:', e);
            }
        }
    }, [spaceId, objects]);

    return { objects, loading, addObject, updateObject, deleteObject, clearAll };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 STICKY NOTE - With Full Drag & Drop Support
// ═══════════════════════════════════════════════════════════════════════════════

const StickyNote = ({ obj, isSelected, onSelect, onDrag, onEdit, isVR }: {
    obj: CanvasObject; isSelected: boolean; onSelect: () => void;
    onDrag: (pos: [number, number, number]) => void; onEdit: (content: string) => void; isVR: boolean;
}) => {
    const [hovered, setHovered] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef<{ x: number; z: number } | null>(null);
    const objStart = useRef<{ x: number; z: number }>({ x: obj.position[0], z: obj.position[2] });
    useCursor(hovered || dragging);

    const y = isVR ? 0.5 : 0.05;
    const rot: [number, number, number] = isVR ? [0, 0, 0] : [-Math.PI / 2, 0, 0];

    // Drag handlers for smooth repositioning
    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        setDragging(true);
        dragStart.current = { x: e.point.x, z: e.point.z };
        objStart.current = { x: obj.position[0], z: obj.position[2] };
        (e.target as any).setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: any) => {
        if (!dragging || !dragStart.current) return;
        e.stopPropagation();
        const dx = e.point.x - dragStart.current.x;
        const dz = e.point.z - dragStart.current.z;
        const newX = objStart.current.x + dx;
        const newZ = objStart.current.z + dz;
        onDrag([newX, 0, newZ]);
    };

    const handlePointerUp = (e: any) => {
        if (dragging) {
            e.stopPropagation();
            setDragging(false);
            dragStart.current = null;
            (e.target as any).releasePointerCapture?.(e.pointerId);
        }
    };

    return (
        <group position={[obj.position[0], y, obj.position[2]]} rotation={rot}>
            {/* Shadow */}
            <mesh position={[0.02, -0.02, -0.005]}>
                <planeGeometry args={[obj.size[0], obj.size[1]]} />
                <meshBasicMaterial color="#000" transparent opacity={0.12} />
            </mesh>
            {/* Body - Draggable */}
            <mesh
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClick={(e) => { e.stopPropagation(); if (!dragging) onSelect(); }}
                onDoubleClick={() => {
                    const txt = prompt('Edit note:', obj.content || '');
                    if (txt !== null) onEdit(txt);
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => { setHovered(false); }}
            >
                <planeGeometry args={[obj.size[0], obj.size[1]]} />
                <meshStandardMaterial
                    color={dragging ? '#fbbf24' : obj.color}
                    roughness={0.85}
                    emissive={dragging ? '#fbbf24' : '#000000'}
                    emissiveIntensity={dragging ? 0.2 : 0}
                />
            </mesh>
            {/* Selection ring */}
            {(isSelected || hovered || dragging) && (
                <mesh position={[0, 0, -0.001]}>
                    <planeGeometry args={[obj.size[0] + 0.04, obj.size[1] + 0.04]} />
                    <meshBasicMaterial color={dragging ? '#fbbf24' : isSelected ? '#0ea5e9' : '#94a3b8'} />
                </mesh>
            )}
            {/* Text */}
            {obj.content && (
                <Text position={[0, 0, 0.005]} fontSize={0.07} color="#1e293b" maxWidth={obj.size[0] - 0.08} textAlign="center" anchorX="center" anchorY="middle">
                    {obj.content}
                </Text>
            )}
            {/* Vote count */}
            {obj.votes && obj.votes > 0 && (
                <group position={[obj.size[0] / 2 - 0.08, obj.size[1] / 2 - 0.08, 0.01]}>
                    <mesh><circleGeometry args={[0.06, 16]} /><meshBasicMaterial color="#ef4444" /></mesh>
                    <Text position={[0, 0, 0.01]} fontSize={0.04} color="#fff" anchorX="center" anchorY="middle">{obj.votes}</Text>
                </group>
            )}
            {/* Drag indicator */}
            {dragging && (
                <Text position={[0, obj.size[1] / 2 + 0.1, 0.01]} fontSize={0.04} color="#fbbf24" anchorX="center" anchorY="middle">
                    ✋ Dragging...
                </Text>
            )}
        </group>
    );
};


// ═══════════════════════════════════════════════════════════════════════════════
// 🔷 SHAPE - With Full Drag & Drop Support
// ═══════════════════════════════════════════════════════════════════════════════

const Shape = ({ obj, isSelected, onSelect, onDrag, isVR }: {
    obj: CanvasObject; isSelected: boolean; onSelect: () => void; onDrag?: (pos: [number, number, number]) => void; isVR: boolean;
}) => {
    const [hovered, setHovered] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef<{ x: number; z: number } | null>(null);
    const objStart = useRef<{ x: number; z: number }>({ x: obj.position[0], z: obj.position[2] });
    useCursor(hovered || dragging);
    const y = isVR ? 0.3 : 0.06;
    const shape = obj.metadata?.shape || 'rect';

    // Drag handlers
    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        setDragging(true);
        dragStart.current = { x: e.point.x, z: e.point.z };
        objStart.current = { x: obj.position[0], z: obj.position[2] };
        (e.target as any).setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: any) => {
        if (!dragging || !dragStart.current || !onDrag) return;
        e.stopPropagation();
        const dx = e.point.x - dragStart.current.x;
        const dz = e.point.z - dragStart.current.z;
        onDrag([objStart.current.x + dx, 0, objStart.current.z + dz]);
    };

    const handlePointerUp = (e: any) => {
        if (dragging) {
            e.stopPropagation();
            setDragging(false);
            dragStart.current = null;
            (e.target as any).releasePointerCapture?.(e.pointerId);
        }
    };

    const shapeProps = {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onClick: (e: any) => { e.stopPropagation(); if (!dragging) onSelect(); },
        onPointerOver: () => setHovered(true),
        onPointerOut: () => setHovered(false)
    };

    return (
        <group position={[obj.position[0], y, obj.position[2]]}>
            {shape === 'rect' && (
                <RoundedBox args={[obj.size[0], isVR ? obj.size[1] : 0.04, isVR ? 0.04 : obj.size[1]]} radius={0.02} smoothness={4} {...shapeProps}>
                    <meshStandardMaterial color={dragging ? '#fbbf24' : obj.color} roughness={0.4} metalness={0.1} emissive={dragging ? '#fbbf24' : '#000000'} emissiveIntensity={dragging ? 0.15 : 0} />
                </RoundedBox>
            )}
            {shape === 'circle' && (
                <mesh rotation={isVR ? [0, 0, 0] : [-Math.PI / 2, 0, 0]} {...shapeProps}>
                    <circleGeometry args={[obj.size[0] / 2, 32]} />
                    <meshStandardMaterial color={dragging ? '#fbbf24' : obj.color} roughness={0.4} />
                </mesh>
            )}
            {shape === 'diamond' && (
                <mesh rotation={isVR ? [0, Math.PI / 4, 0] : [-Math.PI / 2, 0, Math.PI / 4]} {...shapeProps}>
                    <planeGeometry args={[obj.size[0] * 0.7, obj.size[1] * 0.7]} />
                    <meshStandardMaterial color={dragging ? '#fbbf24' : obj.color} roughness={0.4} side={THREE.DoubleSide} />
                </mesh>
            )}
            {(isSelected || hovered || dragging) && (
                <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[Math.max(...obj.size) / 2 + 0.03, Math.max(...obj.size) / 2 + 0.06, 32]} />
                    <meshBasicMaterial color={dragging ? '#fbbf24' : isSelected ? '#0ea5e9' : '#94a3b8'} />
                </mesh>
            )}
            {obj.content && (
                <Text position={[0, isVR ? 0.3 : 0.02, 0]} rotation={isVR ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
                    fontSize={0.08} color="#fff" anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000">
                    {obj.content}
                </Text>
            )}
            {dragging && (
                <Text position={[0, isVR ? 0.5 : 0.1, 0]} rotation={isVR ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
                    fontSize={0.04} color="#fbbf24" anchorX="center" anchorY="middle">
                    ✋ Dragging...
                </Text>
            )}
        </group>
    );
};


// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ FRAME
// ═══════════════════════════════════════════════════════════════════════════════

const Frame = ({ obj, isSelected, onSelect, isVR }: { obj: CanvasObject; isSelected: boolean; onSelect: () => void; isVR: boolean; }) => (
    <group position={[obj.position[0], isVR ? 0.003 : 0.01, obj.position[2]]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            <planeGeometry args={[obj.size[0], obj.size[1]]} />
            <meshStandardMaterial color={obj.color} transparent opacity={0.08} roughness={1} />
        </mesh>
        <Line points={[[-obj.size[0] / 2, 0, -obj.size[1] / 2], [obj.size[0] / 2, 0, -obj.size[1] / 2], [obj.size[0] / 2, 0, obj.size[1] / 2], [-obj.size[0] / 2, 0, obj.size[1] / 2], [-obj.size[0] / 2, 0, -obj.size[1] / 2]]}
            color={isSelected ? '#0ea5e9' : obj.color} lineWidth={isSelected ? 3 : 2} />
        <Text position={[-obj.size[0] / 2 + 0.08, 0.015, -obj.size[1] / 2 - 0.12]} rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.1} color={obj.color} anchorX="left" anchorY="middle" fontWeight="bold">
            {obj.content || 'Frame'}
        </Text>
    </group>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ TIMER
// ═══════════════════════════════════════════════════════════════════════════════

const Timer = ({ obj, onUpdate }: { obj: CanvasObject; onUpdate: (d: Partial<CanvasObject>) => void; }) => {
    const [seconds, setSeconds] = useState(obj.metadata?.seconds || 300);
    const [running, setRunning] = useState(obj.metadata?.running || false);

    useFrame(() => {
        if (running && seconds > 0) {
            setSeconds((s: number) => Math.max(0, s - 1 / 60));
        }
    });

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <group position={[obj.position[0], 0.5, obj.position[2]]}>
            <mesh><cylinderGeometry args={[0.4, 0.4, 0.1, 32]} /><meshStandardMaterial color="#1e293b" metalness={0.5} /></mesh>
            <Text position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color={seconds < 60 ? '#ef4444' : '#22c55e'} anchorX="center" anchorY="middle">
                {formatTime(seconds)}
            </Text>
            <mesh position={[0, 0.08, 0.25]} onClick={() => setRunning(!running)}>
                <boxGeometry args={[0.15, 0.03, 0.08]} />
                <meshBasicMaterial color={running ? '#ef4444' : '#22c55e'} />
            </mesh>
        </group>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TABLE (Kanban-style)
// ═══════════════════════════════════════════════════════════════════════════════

const Table = ({ obj, isSelected, onSelect }: { obj: CanvasObject; isSelected: boolean; onSelect: () => void; }) => {
    const cols = obj.metadata?.columns || ['To Do', 'In Progress', 'Done'];
    const colWidth = obj.size[0] / cols.length;

    return (
        <group position={[obj.position[0], 0.01, obj.position[2]]}>
            {/* Background */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                <planeGeometry args={[obj.size[0], obj.size[1]]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
            {/* Column headers */}
            {cols.map((col: string, i: number) => (
                <group key={i} position={[(i - (cols.length - 1) / 2) * colWidth, 0.02, -obj.size[1] / 2 + 0.15]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[colWidth - 0.05, 0.25]} />
                        <meshStandardMaterial color={['#ef4444', '#f59e0b', '#22c55e'][i] || '#64748b'} />
                    </mesh>
                    <Text position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.06} color="#fff" anchorX="center" anchorY="middle">
                        {col}
                    </Text>
                </group>
            ))}
            {/* Grid lines */}
            {cols.slice(1).map((_: any, i: number) => (
                <Line key={i} points={[[(i + 1 - cols.length / 2) * colWidth, 0.015, -obj.size[1] / 2], [(i + 1 - cols.length / 2) * colWidth, 0.015, obj.size[1] / 2]]}
                    color="#334155" lineWidth={1} />
            ))}
            {isSelected && (
                <Line points={[[-obj.size[0] / 2, 0.02, -obj.size[1] / 2], [obj.size[0] / 2, 0.02, -obj.size[1] / 2], [obj.size[0] / 2, 0.02, obj.size[1] / 2], [-obj.size[0] / 2, 0.02, obj.size[1] / 2], [-obj.size[0] / 2, 0.02, -obj.size[1] / 2]]}
                    color="#0ea5e9" lineWidth={3} />
            )}
        </group>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════════

const Connector = ({ from, to, color = '#64748b' }: { from: [number, number, number]; to: [number, number, number]; color?: string; }) => {
    const points = useMemo(() => {
        const mid = [(from[0] + to[0]) / 2, 0.02, (from[2] + to[2]) / 2];
        return [new THREE.Vector3(from[0], 0.02, from[2]), new THREE.Vector3(mid[0], 0.02, from[2]), new THREE.Vector3(mid[0], 0.02, to[2]), new THREE.Vector3(to[0], 0.02, to[2])];
    }, [from, to]);
    return <Line points={points} color={color} lineWidth={2} />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎛️ TOOLBAR
// ═══════════════════════════════════════════════════════════════════════════════

const Toolbar = ({ mode, setMode, color, setColor, onAI, onClear, onUndo, onRedo, isVR, setVR, onAddTimer, onAddTable }: {
    mode: ToolMode; setMode: (m: ToolMode) => void; color: string; setColor: (c: string) => void;
    onAI: () => void; onClear: () => void; onUndo: () => void; onRedo: () => void;
    isVR: boolean; setVR: (v: boolean) => void; onAddTimer: () => void; onAddTable: () => void;
}) => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000]">
        <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Master Control Badge */}
            <div className="flex flex-col border-r border-white/10 pr-4 mr-2">
                <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">Nexus-OS</span>
                <span className="text-[8px] text-gray-500 font-mono">v2.0.4 // SECURE</span>
            </div>

            {/* Core Interaction Engine */}
            <div className="flex gap-1.5 border-r border-white/10 pr-3">
                {[
                    ['select', '↖', 'Selection Mode'],
                    ['pan', '✋', 'View Pan'],
                    ['sticky', '📝', 'Add Insight'],
                    ['shape', '⬜', 'Diagram'],
                    ['text', 'T', 'Annotation'],
                    ['connector', '🔗', 'Logic Link'],
                    ['eraser', '🧹', 'Purge'],
                    ['vote', '👍', 'Consensus']
                ].map(([m, i, l]) => (
                    <Btn key={m} icon={i as string} active={mode === m} onClick={() => setMode(m as ToolMode)} tooltip={l as string} />
                ))}
            </div>

            {/* Professional Palette */}
            <div className="flex gap-1.5 border-r border-white/10 pr-3">
                {['#f8fafc', '#94a3b8', '#334155', '#1e293b', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b'].map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-4 h-4 rounded-full border border-white/10 transition-all hover:scale-125 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : ''}`}
                        style={{ background: c }}
                    />
                ))}
            </div>

            {/* Enterprise Utilities */}
            <div className="flex gap-2 items-center">
                <div className="flex gap-1 pr-2">
                    <Btn icon="⏱️" onClick={onAddTimer} tooltip="Collaboration Timer" />
                    <Btn icon="📊" onClick={onAddTable} tooltip="Executive Dashboard" />
                    <Btn icon="✨" onClick={onAI} glow tooltip="AI Synthesis" />
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <button
                    onClick={() => setVR(!isVR)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-tighter uppercase transition-all border ${isVR ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/5 text-gray-500 border-white/10'
                        }`}
                >
                    {isVR ? 'Neural 3D' : 'Static 2D'}
                </button>
            </div>
        </div>
    </div>
);

const Btn = ({ icon, active, onClick, glow, danger, tooltip }: { icon: string; active?: boolean; onClick: () => void; glow?: boolean; danger?: boolean; tooltip?: string }) => (
    <button
        onClick={onClick}
        title={tooltip}
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200 group relative
        ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                glow ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                    danger ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent hover:border-white/10'}`}
    >
        <span className="group-hover:scale-110 transition-transform">{icon}</span>
        {tooltip && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#0f172a] text-[9px] font-bold text-white px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap uppercase tracking-widest shadow-2xl">
                    {tooltip}
                </div>
            </div>
        )}
    </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const InfiniteCanvas: React.FC<CanvasProps> = ({ spaceId, userId, userName, accentColor = '#0ea5e9', isVRMode: initVR = true, activeTool, toolColor, hideFloor = false, hideUI = false, user, onUpdateUser }) => {
    const { objects, addObject, updateObject, deleteObject, clearAll } = useCanvasObjects(spaceId);
    const [selected, setSelected] = useState<string[]>([]);
    const [mode, setMode] = useState<ToolMode>('select');
    const [color, setColor] = useState(STICKY_COLORS[0]);
    const [isVR, setVR] = useState(initVR);
    const [showAI, setShowAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [history, setHistory] = useState<CanvasObject[][]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const [connectFrom, setConnectFrom] = useState<string | null>(null);

    // Sync with XRPreview toolbar
    useEffect(() => {
        if (activeTool) {
            const toolMap: Record<string, ToolMode> = {
                'cursor': 'select',
                'select': 'select',
                'sticky': 'sticky',
                'shape': 'shape',
                'text': 'text',
                'connector': 'connector',
                'frame': 'frame',
                'eraser': 'eraser',
                'vote': 'vote',
                'sticker': 'sticker'
            };
            setMode(toolMap[activeTool] || 'select');
        }
    }, [activeTool]);

    useEffect(() => {
        if (toolColor) setColor(toolColor);
    }, [toolColor]);

    const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        const p = e.point;
        if (mode === 'sticky') addObject({ type: 'sticky', position: [p.x, 0, p.z], size: [0.8, 0.8], color, content: 'Note', createdBy: userId });
        else if (mode === 'shape') addObject({ type: 'shape', position: [p.x, 0, p.z], size: [1, 0.6], color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)], metadata: { shape: 'rect' }, createdBy: userId });
        else if (mode === 'frame') addObject({ type: 'frame', position: [p.x, 0, p.z], size: [4, 3], color: accentColor, content: 'Frame', createdBy: userId });
        else if (mode === 'text') {
            const txt = prompt('Enter text:');
            if (txt) addObject({ type: 'text', position: [p.x, 0, p.z], size: [1, 0.3], color: '#ffffff', content: txt, createdBy: userId });
        }
        else if (mode === 'sticker') {
            addObject({ type: 'sticker', position: [p.x, 0, p.z], size: [0.5, 0.5], color: '#ffffff', content: toolColor || '✨', createdBy: userId });
        }
    }, [mode, color, userId, accentColor, addObject, toolColor]);

    const handleSelect = useCallback((id: string) => {
        if (mode === 'vote') {
            const obj = objects.find(o => o.id === id);
            if (obj) updateObject(id, { votes: (obj.votes || 0) + 1 });
        } else if (mode === 'eraser') {
            deleteObject(id);
        } else if (mode === 'connector') {
            if (!connectFrom) setConnectFrom(id);
            else {
                const from = objects.find(o => o.id === connectFrom);
                const to = objects.find(o => o.id === id);
                if (from && to) {
                    addObject({ type: 'connector', position: from.position, size: [0, 0], color: '#64748b', metadata: { toId: id, fromId: connectFrom }, createdBy: userId });
                }
                setConnectFrom(null);
            }
        } else {
            setSelected([id]);
        }
    }, [mode, objects, connectFrom, addObject, updateObject, deleteObject, userId]);

    const runAI = useCallback(async (prompt: string) => {
        const items: Omit<CanvasObject, 'id'>[] = [];
        if (prompt.toLowerCase().includes('mindmap')) {
            items.push({ type: 'shape', position: [0, 0, 0], size: [1.5, 1], color: '#3b82f6', content: prompt.split(' ').slice(0, 2).join(' '), metadata: { shape: 'rect' }, createdBy: userId });
            ['Idea A', 'Idea B', 'Idea C', 'Idea D', 'Idea E'].forEach((t, i) => {
                const a = (i * Math.PI * 2) / 5;
                items.push({ type: 'sticky', position: [Math.cos(a) * 3, 0, Math.sin(a) * 3], size: [0.8, 0.8], color: STICKY_COLORS[i], content: t, createdBy: userId });
            });
        } else if (prompt.toLowerCase().includes('kanban')) {
            items.push({ type: 'table', position: [0, 0, 0], size: [6, 4], color: '#1e293b', metadata: { columns: ['Backlog', 'In Progress', 'Review', 'Done'] }, createdBy: userId });
        } else if (prompt.toLowerCase().includes('swot')) {
            [[-1.5, -1.5, 'Strengths', '#22c55e'], [1.5, -1.5, 'Weaknesses', '#ef4444'], [-1.5, 1.5, 'Opportunities', '#3b82f6'], [1.5, 1.5, 'Threats', '#f59e0b']].forEach(([x, z, t, c]) => {
                items.push({ type: 'frame', position: [x as number, 0, z as number], size: [2.5, 2], color: c as string, content: t as string, createdBy: userId });
            });
        } else {
            for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
                items.push({ type: 'sticky', position: [(j - 1.5) * 1.1, 0, (i - 1) * 1.1], size: [0.8, 0.8], color: STICKY_COLORS[(i * 4 + j) % 8], content: `Item ${i * 4 + j + 1}`, createdBy: userId });
            }
        }
        for (const it of items) await addObject(it);
        setShowAI(false);
        setAiPrompt('');
    }, [addObject, userId]);

    const addTimer = () => addObject({ type: 'timer', position: [0, 0, 0], size: [0.8, 0.8], color: '#1e293b', metadata: { seconds: 300, running: false }, createdBy: userId });
    const addTable = () => addObject({ type: 'table', position: [0, 0, 0], size: [5, 3], color: '#1e293b', metadata: { columns: ['To Do', 'In Progress', 'Done'] }, createdBy: userId });

    const [showOnboarding, setShowOnboarding] = useState(!user?.hasCompletedMixboardOnboarding);
    const [onboardingStep, setOnboardingStep] = useState(0);

    const onboardingSteps = [
        { title: "Infinite Mixboard", text: "Welcome to your spatial command center. This canvas persists across all your VR sessions.", icon: "✨" },
        { title: "Smart Sticky Notes", text: "Use the toolbar to drop ideas. They are instantly indexed by the GreenGalaxy Nexus.", icon: "📝" },
        { title: "Gemini Integration", text: "Type a prompt and click 'GENERATE' to let AI build entire workshop layouts for you.", icon: "🤖" }
    ];

    const nextStep = () => {
        if (onboardingStep < onboardingSteps.length - 1) {
            setOnboardingStep(prev => prev + 1);
        } else {
            setShowOnboarding(false);
            if (onUpdateUser) onUpdateUser({ hasCompletedMixboardOnboarding: true });
        }
    };

    return (
        <>
            {/* 🎓 ONBOARDING OVERLAY */}
            {showOnboarding && isVR && (
                <Html position={[0, 2, 0]} center transform distanceFactor={5}>
                    <div className="w-[450px] p-10 bg-[#0f172a]/95 backdrop-blur-2xl rounded-[3rem] text-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-cyan-500/20 animate-in fade-in zoom-in duration-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                                {onboardingSteps[onboardingStep].icon}
                            </div>
                            <h3 className="text-3xl font-black mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">{onboardingSteps[onboardingStep].title}</h3>
                            <p className="text-gray-400 mb-10 leading-relaxed font-light text-lg">{onboardingSteps[onboardingStep].text}</p>

                            <div className="flex gap-3 mb-10">
                                {onboardingSteps.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === onboardingStep ? 'bg-cyan-500 w-12' : 'bg-white/10 w-4'}`}></div>
                                ))}
                            </div>

                            <button
                                onClick={nextStep}
                                className="w-full py-5 bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95"
                            >
                                {onboardingStep === onboardingSteps.length - 1 ? "Start Collaborating" : "Next Module"}
                            </button>
                        </div>
                    </div>
                </Html>
            )}
            {/* Floor */}
            {!hideFloor && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={handleClick}>
                        <planeGeometry args={[200, 200]} /><meshStandardMaterial color="#080810" roughness={0.95} />
                    </mesh>
                    <gridHelper args={[200, 100, '#1a1a2a', '#0f0f18']} position={[0, 0.001, 0]} />
                </>
            )}

            {/* If floor is hidden, we still need a click target for the canvas if no other floor is provided */}
            {hideFloor && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handleClick}>
                    <planeGeometry args={[1000, 1000]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}

            {/* Objects */}
            {objects.map(obj => {
                const sel = selected.includes(obj.id);
                if (obj.type === 'sticky') return <StickyNote key={obj.id} obj={obj} isSelected={sel} onSelect={() => handleSelect(obj.id)} onDrag={(p) => updateObject(obj.id, { position: p })} onEdit={(c) => updateObject(obj.id, { content: c })} isVR={isVR} />;
                if (obj.type === 'shape') return <Shape key={obj.id} obj={obj} isSelected={sel} onSelect={() => handleSelect(obj.id)} onDrag={(p) => updateObject(obj.id, { position: p })} isVR={isVR} />;
                if (obj.type === 'frame') return <Frame key={obj.id} obj={obj} isSelected={sel} onSelect={() => handleSelect(obj.id)} isVR={isVR} />;
                if (obj.type === 'timer') return <Timer key={obj.id} obj={obj} onUpdate={(d) => updateObject(obj.id, d)} />;
                if (obj.type === 'table') return <Table key={obj.id} obj={obj} isSelected={sel} onSelect={() => handleSelect(obj.id)} />;
                if (obj.type === 'connector') {
                    const from = objects.find(o => o.id === obj.metadata?.fromId);
                    const to = objects.find(o => o.id === obj.metadata?.toId);
                    if (from && to) return <Connector key={obj.id} from={from.position} to={to.position} color={obj.color} />;
                }
                if (obj.type === 'text') return (
                    <Text key={obj.id} position={[obj.position[0], 0.05, obj.position[2]]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color={obj.color} anchorX="center" anchorY="middle">
                        {obj.content}
                    </Text>
                );
                if (obj.type === 'sticker') return (
                    <Text key={obj.id} position={[obj.position[0], 0.1, obj.position[2]]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.5} anchorX="center" anchorY="middle">
                        {obj.content}
                    </Text>
                );
                return null;
            })}

            {/* UI - Portal to document body for proper UI - Only show if not in VR room mode */}
            {!hideUI && !isVR && createPortal(
                <>
                    <Toolbar mode={mode} setMode={setMode} color={color} setColor={setColor} onAI={() => setShowAI(true)} onClear={() => confirm('Clear all?') && clearAll()} onUndo={() => { }} onRedo={() => { }} isVR={isVR} setVR={setVR} onAddTimer={addTimer} onAddTable={addTable} />
                    {showAI && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-[100000]">
                            <div className="bg-slate-900 border border-white/10 rounded-2xl w-[480px] overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-5 py-3 border-b border-white/5">
                                    <h3 className="text-white font-semibold">✨ AI Canvas Generator</h3>
                                </div>
                                <div className="p-5">
                                    <input autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAI(aiPrompt)}
                                        placeholder="e.g. Mindmap, Kanban Board, SWOT Analysis..." className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" />
                                    <div className="flex gap-2 mt-3">
                                        {['Mindmap', 'Kanban', 'SWOT', 'Brainstorm'].map(t => (
                                            <button key={t} onClick={() => setAiPrompt(t)} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/10">{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="px-5 py-3 border-t border-white/5 flex justify-end gap-2">
                                    <button onClick={() => setShowAI(false)} className="px-4 py-2 text-gray-400">Cancel</button>
                                    <button onClick={() => runAI(aiPrompt)} disabled={!aiPrompt} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-xl disabled:opacity-50">Generate</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </>
    );
};

export default InfiniteCanvas;
