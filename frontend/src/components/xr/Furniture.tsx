import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Cylinder, Box, Sphere, Torus, Gltf, Text } from '@react-three/drei';
import { Group } from 'three';
import { FurnitureMap } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏢 GOOGLE HQ / NATO COMMAND CENTER STYLE FURNITURE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Design Philosophy:
 * - Clean, minimalist lines with premium materials
 * - High-tech holographic displays and ambient lighting
 * - Corporate professional atmosphere with futuristic touches
 * - Pure Three.js geometry - no external models needed
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM MATERIALS - Google/NATO Style
// ═══════════════════════════════════════════════════════════════════════════════

// 1. BRUSHED METAL (Tables, Frames)
const BrushedMetalMaterial = ({ color = "#2a2a35" }: { color?: string }) => (
    <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.3}
        envMapIntensity={1.5}
    />
);

// 2. CHROME (Legs, Accents)
const ChromeMaterial = () => (
    <meshStandardMaterial
        color="#ffffff"
        metalness={1.0}
        roughness={0.1}
        envMapIntensity={2.0}
    />
);

// 3. MATTE BLACK (Premium surfaces)
const MatteBlackMaterial = () => (
    <meshStandardMaterial
        color="#0a0a0f"
        metalness={0.2}
        roughness={0.8}
    />
);

// 4. HOLOGRAPHIC GLASS (Screens, Displays)
const HoloGlassMaterial = ({ color = "#0ea5e9" }: { color?: string }) => (
    <meshPhysicalMaterial
        color={color}
        transmission={0.6}
        opacity={0.9}
        metalness={0.1}
        roughness={0.05}
        ior={1.5}
        thickness={0.5}
        transparent
        envMapIntensity={2}
    />
);

// 5. NEON GLOW (Accent lines)
const NeonMaterial = ({ color }: { color: string }) => (
    <meshBasicMaterial color={color} toneMapped={false} />
);

// 6. PREMIUM LEATHER (Chairs)
const LeatherMaterial = ({ color = "#1a1a1f" }: { color?: string }) => (
    <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.05}
    />
);

// 7. CARBON FIBER (Tech elements)
const CarbonFiberMaterial = () => (
    <meshStandardMaterial
        color="#111118"
        metalness={0.4}
        roughness={0.6}
    />
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🖥️ COMMAND CENTER ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Holographic Display Panel
const HoloDisplay = ({
    position,
    rotation = [0, 0, 0],
    size = [2, 1.2],
    color = "#0ea5e9",
    label = "SYSTEM STATUS"
}: {
    position: [number, number, number],
    rotation?: [number, number, number],
    size?: [number, number],
    color?: string,
    label?: string
}) => {
    const frameRef = useRef<Group>(null);

    useFrame((state) => {
        if (frameRef.current) {
            // Subtle pulse animation
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 1;
            frameRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <group position={position} rotation={rotation}>
            {/* Frame */}
            <RoundedBox args={[size[0] + 0.1, size[1] + 0.1, 0.05]} radius={0.02} smoothness={4}>
                <BrushedMetalMaterial color="#1a1a25" />
            </RoundedBox>

            {/* Screen */}
            <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={size} />
                <meshStandardMaterial
                    color="#0a0a15"
                    emissive={color}
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Glow frame */}
            <group ref={frameRef}>
                <mesh position={[0, size[1] / 2 + 0.02, 0.04]}>
                    <boxGeometry args={[size[0] - 0.1, 0.02, 0.01]} />
                    <NeonMaterial color={color} />
                </mesh>
                <mesh position={[0, -size[1] / 2 - 0.02, 0.04]}>
                    <boxGeometry args={[size[0] - 0.1, 0.02, 0.01]} />
                    <NeonMaterial color={color} />
                </mesh>
            </group>

            {/* Status indicator */}
            <mesh position={[size[0] / 2 - 0.1, size[1] / 2 - 0.1, 0.04]}>
                <circleGeometry args={[0.03, 16]} />
                <NeonMaterial color="#22c55e" />
            </mesh>

            {/* Label */}
            <Text
                position={[0, size[1] / 2 + 0.12, 0.02]}
                fontSize={0.06}
                color="#64748b"
                anchorX="center"
            >
                {label}
            </Text>
        </group>
    );
};

// Command Center Console
const CommandConsole = ({ position, rotation = [0, 0, 0], accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    rotation?: [number, number, number],
    accentColor?: string
}) => (
    <group position={position} rotation={rotation}>
        {/* Main desk body */}
        <RoundedBox args={[4, 0.8, 1.2]} radius={0.05} smoothness={4} position={[0, 0.4, 0]} castShadow receiveShadow>
            <BrushedMetalMaterial color="#15151f" />
        </RoundedBox>

        {/* Work surface */}
        <RoundedBox args={[3.8, 0.05, 1]} radius={0.02} smoothness={4} position={[0, 0.82, 0]} castShadow receiveShadow>
            <MatteBlackMaterial />
        </RoundedBox>

        {/* Accent light strip */}
        <mesh position={[0, 0.85, 0.48]}>
            <boxGeometry args={[3.5, 0.01, 0.02]} />
            <NeonMaterial color={accentColor} />
        </mesh>

        {/* Side panels */}
        <RoundedBox args={[0.1, 0.6, 1]} radius={0.02} smoothness={4} position={[-1.95, 0.5, 0]} castShadow receiveShadow>
            <CarbonFiberMaterial />
        </RoundedBox>
        <RoundedBox args={[0.1, 0.6, 1]} radius={0.02} smoothness={4} position={[1.95, 0.5, 0]} castShadow receiveShadow>
            <CarbonFiberMaterial />
        </RoundedBox>

        {/* Built-in displays */}
        <HoloDisplay position={[0, 1.8, -0.3]} size={[2.5, 1.4]} color={accentColor} label="MAIN TERMINAL" />
        <HoloDisplay position={[-1.5, 1.5, -0.2]} rotation={[0, 0.3, 0]} size={[1, 0.8]} color="#22c55e" label="METRICS" />
        <HoloDisplay position={[1.5, 1.5, -0.2]} rotation={[0, -0.3, 0]} size={[1, 0.8]} color="#f59e0b" label="ALERTS" />
    </group>
);

// Executive Chair
const ExecutiveChair = ({ position, rotation = [0, 0, 0], accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    rotation?: [number, number, number],
    accentColor?: string
}) => {
    const chairRef = useRef<Group>(null);

    useFrame((state) => {
        if (chairRef.current) {
            // Subtle floating animation
            chairRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.01;
        }
    });

    return (
        <group ref={chairRef} position={position} rotation={rotation}>
            {/* Base - Chrome star */}
            <group position={[0, 0.08, 0]}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <mesh key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]} position={[0.2, 0, 0]}>
                        <capsuleGeometry args={[0.03, 0.3, 4, 8]} />
                        <ChromeMaterial />
                    </mesh>
                ))}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
                    <ChromeMaterial />
                </mesh>
            </group>

            {/* Hydraulic column */}
            <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.5, 16]} />
                <ChromeMaterial />
            </mesh>

            {/* Seat */}
            <RoundedBox args={[0.55, 0.1, 0.55]} radius={0.03} smoothness={4} position={[0, 0.65, 0]} castShadow receiveShadow>
                <LeatherMaterial color="#1a1a1f" />
            </RoundedBox>

            {/* Backrest */}
            <RoundedBox args={[0.5, 0.7, 0.08]} radius={0.03} smoothness={4} position={[0, 1.1, 0.25]} castShadow receiveShadow>
                <LeatherMaterial color="#1a1a1f" />
            </RoundedBox>

            {/* Headrest */}
            <RoundedBox args={[0.3, 0.15, 0.06]} radius={0.02} smoothness={4} position={[0, 1.55, 0.27]} castShadow receiveShadow>
                <LeatherMaterial color="#1a1a1f" />
            </RoundedBox>

            {/* Armrests */}
            <RoundedBox args={[0.08, 0.05, 0.3]} radius={0.01} smoothness={4} position={[-0.32, 0.85, 0.05]} castShadow receiveShadow>
                <CarbonFiberMaterial />
            </RoundedBox>
            <RoundedBox args={[0.08, 0.05, 0.3]} radius={0.01} smoothness={4} position={[0.32, 0.85, 0.05]} castShadow receiveShadow>
                <CarbonFiberMaterial />
            </RoundedBox>

            {/* Accent lights on armrests */}
            <mesh position={[-0.32, 0.88, -0.05]}>
                <boxGeometry args={[0.06, 0.01, 0.15]} />
                <NeonMaterial color={accentColor} />
            </mesh>
            <mesh position={[0.32, 0.88, -0.05]}>
                <boxGeometry args={[0.06, 0.01, 0.15]} />
                <NeonMaterial color={accentColor} />
            </mesh>
        </group>
    );
};

// Ceiling Panel Light (Google-style)
const CeilingPanel = ({ position, color = "#ffffff", size = [4, 4] }: {
    position: [number, number, number],
    color?: string,
    size?: [number, number]
}) => (
    <group position={position}>
        {/* Panel frame */}
        <RoundedBox args={[size[0], 0.08, size[1]]} radius={0.02} smoothness={4}>
            <BrushedMetalMaterial color="#1a1a25" />
        </RoundedBox>

        {/* Light strips */}
        <mesh position={[0, -0.05, 0]}>
            <planeGeometry args={[size[0] - 0.3, size[1] - 0.3]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
            />
        </mesh>

        {/* Actual light */}
        <pointLight position={[0, -0.5, 0]} distance={15} intensity={2} color={color} castShadow receiveShadow />
    </group>
);

// Standing Meeting Table
const StandingTable = ({ position, accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    accentColor?: string
}) => (
    <group position={position}>
        {/* Central column */}
        <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 1, 16]} />
            <ChromeMaterial />
        </mesh>

        {/* Base */}
        <mesh position={[0, 0.03, 0]} receiveShadow>
            <cylinderGeometry args={[0.4, 0.45, 0.06, 32]} />
            <BrushedMetalMaterial color="#15151f" />
        </mesh>

        {/* Tabletop */}
        <Cylinder args={[0.6, 0.6, 0.05, 32]} position={[0, 1.05, 0]} castShadow receiveShadow>
            <MatteBlackMaterial />
        </Cylinder>

        {/* Edge light */}
        <mesh position={[0, 1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.58, 0.01, 8, 32]} />
            <NeonMaterial color={accentColor} />
        </mesh>
    </group>
);

// Decorative Wall Panel
const WallPanel = ({ position, rotation, size = [3, 2], accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    rotation: [number, number, number],
    size?: [number, number],
    accentColor?: string
}) => (
    <group position={position} rotation={rotation}>
        {/* Main panel */}
        <RoundedBox args={[size[0], size[1], 0.05]} radius={0.02} smoothness={4}>
            <BrushedMetalMaterial color="#12121a" />
        </RoundedBox>

        {/* Diagonal accent lines */}
        <mesh position={[-size[0] / 4, 0, 0.03]}>
            <boxGeometry args={[0.02, size[1] * 0.8, 0.01]} />
            <NeonMaterial color={accentColor} />
        </mesh>
        <mesh position={[size[0] / 4, 0, 0.03]}>
            <boxGeometry args={[0.02, size[1] * 0.8, 0.01]} />
            <NeonMaterial color={accentColor} />
        </mesh>
    </group>
);

// Tech Planter
const TechPlanter = ({ position, size = 1 }: { position: [number, number, number], size?: number }) => (
    <group position={position} scale={size}>
        {/* Container */}
        <Cylinder args={[0.35, 0.3, 0.7, 6]} position={[0, 0.35, 0]} castShadow receiveShadow>
            <BrushedMetalMaterial color="#1a1a25" />
        </Cylinder>

        {/* Soil */}
        <Cylinder args={[0.3, 0.3, 0.05, 16]} position={[0, 0.68, 0]}>
            <meshStandardMaterial color="#2d1f14" roughness={1} />
        </Cylinder>

        {/* Plant - abstract geometric */}
        <group position={[0, 0.7, 0]}>
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[Math.sin(i * 1.5) * 0.1, 0.3 + i * 0.15, Math.cos(i * 1.5) * 0.1]} rotation={[0.2, i, 0.1]}>
                    <coneGeometry args={[0.08, 0.4, 4]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.6} />
                </mesh>
            ))}
        </group>

        {/* Base light */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.28, 0.32, 6]} />
            <NeonMaterial color="#22c55e" />
        </mesh>
    </group>
);

// Meeting Room Table (Long conference)
const ConferenceTable = ({ position, length = 6, accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    length?: number,
    accentColor?: string
}) => (
    <group position={position}>
        {/* Tabletop */}
        <RoundedBox args={[length, 0.08, 2]} radius={0.02} smoothness={4} position={[0, 0.75, 0]} castShadow receiveShadow>
            <MatteBlackMaterial />
        </RoundedBox>

        {/* Glass top layer */}
        <mesh position={[0, 0.8, 0]} receiveShadow>
            <boxGeometry args={[length - 0.2, 0.02, 1.8]} />
            <HoloGlassMaterial color="#1a1a25" />
        </mesh>

        {/* Central power/data strip */}
        <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[length - 1, 0.02, 0.15]} />
            <BrushedMetalMaterial color="#0a0a10" />
        </mesh>
        <mesh position={[0, 0.84, 0]}>
            <boxGeometry args={[length - 1.5, 0.005, 0.05]} />
            <NeonMaterial color={accentColor} />
        </mesh>

        {/* Legs */}
        <mesh position={[-(length / 2 - 0.5), 0.375, 0]}>
            <boxGeometry args={[0.15, 0.75, 0.8]} />
            <BrushedMetalMaterial color="#15151f" />
        </mesh>
        <mesh position={[(length / 2 - 0.5), 0.375, 0]}>
            <boxGeometry args={[0.15, 0.75, 0.8]} />
            <BrushedMetalMaterial color="#15151f" />
        </mesh>
    </group>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 ROOM LAYOUTS
// ═══════════════════════════════════════════════════════════════════════════════

interface FurnitureProps {
    accentColor: string;
    furnitureMap?: FurnitureMap;
}

// BOARDROOM - Executive Command Center Style
export const BoardroomFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Ceiling Panels */}
            <CeilingPanel position={[0, 9, 0]} size={[8, 8]} color="#ffffff" />
            <CeilingPanel position={[-10, 9, 0]} size={[5, 5]} color={accentColor} />
            <CeilingPanel position={[10, 9, 0]} size={[5, 5]} color={accentColor} />

            {/* Main Conference Table */}
            <ConferenceTable position={[0, 0, 0]} length={8} accentColor={accentColor} />

            {/* Executive Chairs - positioned OUTSIDE the table with proper spacing */}
            {/* Front row - facing the table */}
            {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
                <ExecutiveChair key={`front-${i}`} position={[x, 0, 2.5]} rotation={[0, Math.PI, 0]} accentColor={accentColor} />
            ))}
            {/* Back row - facing the table */}
            {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
                <ExecutiveChair key={`back-${i}`} position={[x, 0, -2.5]} rotation={[0, 0, 0]} accentColor={accentColor} />
            ))}
            {/* Head of table seats */}
            <ExecutiveChair position={[5.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[-5.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} accentColor={accentColor} />

            {/* Wall Displays */}
            <WallPanel position={[-12, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} size={[5, 3]} accentColor={accentColor} />
            <WallPanel position={[12, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} size={[5, 3]} accentColor={accentColor} />

            {/* Corner Planters */}
            <TechPlanter position={[-10, 0, -10]} size={1.8} />
            <TechPlanter position={[10, 0, -10]} size={1.8} />
            <TechPlanter position={[-10, 0, 10]} size={1.8} />
            <TechPlanter position={[10, 0, 10]} size={1.8} />
        </group>
    );
};

// STUDIO - Creative Command Center
export const StudioFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Ceiling */}
            <CeilingPanel position={[0, 9, 0]} size={[8, 8]} color="#ffffff" />
            <CeilingPanel position={[-10, 9, 5]} size={[4, 4]} color="#ec4899" />
            <CeilingPanel position={[10, 9, 5]} size={[4, 4]} color="#8b5cf6" />

            {/* Command Consoles - arranged in arc */}
            <CommandConsole position={[0, 0, 5]} rotation={[0, Math.PI, 0]} accentColor={accentColor} />
            <CommandConsole position={[-6, 0, 3]} rotation={[0, Math.PI + 0.4, 0]} accentColor="#ec4899" />
            <CommandConsole position={[6, 0, 3]} rotation={[0, Math.PI - 0.4, 0]} accentColor="#8b5cf6" />

            {/* Central Standing Tables */}
            <StandingTable position={[-2, 0, -2]} accentColor={accentColor} />
            <StandingTable position={[2, 0, -2]} accentColor={accentColor} />

            {/* Executive Chairs for consoles */}
            <ExecutiveChair position={[0, 0, 7]} rotation={[0, Math.PI, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[-6, 0, 5.5]} rotation={[0, Math.PI + 0.4, 0]} accentColor="#ec4899" />
            <ExecutiveChair position={[6, 0, 5.5]} rotation={[0, Math.PI - 0.4, 0]} accentColor="#8b5cf6" />

            {/* Side Displays */}
            <HoloDisplay position={[-12, 3, 0]} rotation={[0, Math.PI / 2, 0]} size={[3, 2]} color="#ec4899" label="CREATIVE HUB" />
            <HoloDisplay position={[12, 3, 0]} rotation={[0, -Math.PI / 2, 0]} size={[3, 2]} color="#8b5cf6" label="COLLABORATION" />

            {/* Planters */}
            <TechPlanter position={[-10, 0, -8]} size={1.8} />
            <TechPlanter position={[10, 0, -8]} size={1.8} />
        </group>
    );
};

// ZEN - Focus & Meditation Command
export const ZenFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Soft ambient lighting */}
            <CeilingPanel position={[0, 8, 0]} size={[5, 5]} color="#22c55e" />

            {/* Central meditation platform */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <cylinderGeometry args={[4, 4.2, 0.1, 64]} />
                <meshStandardMaterial color="#1a1a1f" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.8, 4, 64]} />
                <NeonMaterial color="#22c55e" />
            </mesh>

            {/* Zen seats arranged in circle */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (i * Math.PI * 2) / 6;
                const x = Math.sin(angle) * 2.5;
                const z = Math.cos(angle) * 2.5;
                return (
                    <group key={i} position={[x, 0, z]}>
                        <Cylinder args={[0.4, 0.4, 0.2, 32]} position={[0, 0.1, 0]} castShadow receiveShadow>
                            <LeatherMaterial color="#1f1f25" />
                        </Cylinder>
                    </group>
                );
            })}

            {/* Standing consoles on perimeter */}
            <CommandConsole position={[0, 0, -6]} rotation={[0, 0, 0]} accentColor="#22c55e" />

            {/* Abundant plants */}
            <TechPlanter position={[-6, 0, -4]} size={2} />
            <TechPlanter position={[6, 0, -4]} size={2} />
            <TechPlanter position={[-5, 0, 5]} size={1.5} />
            <TechPlanter position={[5, 0, 5]} size={1.5} />
            <TechPlanter position={[0, 0, 7]} size={2.5} />
        </group>
    );
};

// EXPO/MALL - Presentation Command Center
export const ExpoFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Main stage lighting */}
            <CeilingPanel position={[0, 10, -8]} size={[10, 4]} color={accentColor} />
            <CeilingPanel position={[0, 10, 5]} size={[8, 8]} color="#ffffff" />

            {/* Main stage console */}
            <CommandConsole position={[0, 0, -8]} rotation={[0, 0, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[0, 0, -5.5]} rotation={[0, 0, 0]} accentColor={accentColor} />

            {/* Audience seating - rows */}
            {[0, 3, 6, 9].map((zOffset, rowIndex) => (
                <group key={rowIndex} position={[0, 0, zOffset]}>
                    {[-6, -3, 0, 3, 6].map((x, i) => (
                        <ExecutiveChair
                            key={`${rowIndex}-${i}`}
                            position={[x, 0, 0]}
                            rotation={[0, 0, 0]}
                            accentColor={accentColor}
                        />
                    ))}
                </group>
            ))}

            {/* Side presentation displays */}
            <WallPanel position={[-10, 3, -5]} rotation={[0, 0.3, 0]} size={[2, 3]} accentColor={accentColor} />
            <WallPanel position={[10, 3, -5]} rotation={[0, -0.3, 0]} size={[2, 3]} accentColor={accentColor} />
        </group>
    );
};

// FULL OFFICE - Complete Command Center Floor
export const FullOfficeLayout = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Multiple ceiling panels for open floor */}
            <CeilingPanel position={[0, 10, -20]} size={[12, 6]} color={accentColor} />
            <CeilingPanel position={[-15, 10, 0]} size={[6, 6]} color="#f59e0b" />
            <CeilingPanel position={[15, 10, 0]} size={[6, 6]} color="#3b82f6" />
            <CeilingPanel position={[0, 10, 15]} size={[8, 6]} color="#ffffff" />

            {/* Main presentation stage */}
            <group position={[0, 0, -20]}>
                <mesh position={[0, 0.15, 0]} receiveShadow>
                    <boxGeometry args={[12, 0.3, 6]} />
                    <BrushedMetalMaterial color="#0a0a10" />
                </mesh>
                <CommandConsole position={[0, 0.3, 0]} accentColor={accentColor} />
                <ExecutiveChair position={[0, 0.3, 3]} rotation={[0, 0, 0]} accentColor={accentColor} />
            </group>

            {/* Audience area */}
            {[-12, -8, -4, 0, 4].map((z, rowIndex) => (
                <group key={rowIndex} position={[0, 0, z]}>
                    {[-8, -4, 0, 4, 8].map((x, i) => (
                        <ExecutiveChair
                            key={`${rowIndex}-${i}`}
                            position={[x, 0, 0]}
                            rotation={[0, 0, 0]}
                            accentColor={accentColor}
                        />
                    ))}
                </group>
            ))}

            {/* Side work zones */}
            <group position={[-18, 0, 0]}>
                <ConferenceTable position={[0, 0, 0]} length={4} accentColor="#f59e0b" />
                {[-1, 1].map((x, i) => (
                    <ExecutiveChair key={`left-${i}`} position={[x, 0, 2.2]} rotation={[0, Math.PI, 0]} accentColor="#f59e0b" />
                ))}
                {[-1, 1].map((x, i) => (
                    <ExecutiveChair key={`left2-${i}`} position={[x, 0, -2.2]} rotation={[0, 0, 0]} accentColor="#f59e0b" />
                ))}
            </group>

            <group position={[18, 0, 0]}>
                <ConferenceTable position={[0, 0, 0]} length={4} accentColor="#3b82f6" />
                {[-1, 1].map((x, i) => (
                    <ExecutiveChair key={`right-${i}`} position={[x, 0, 2.2]} rotation={[0, Math.PI, 0]} accentColor="#3b82f6" />
                ))}
                {[-1, 1].map((x, i) => (
                    <ExecutiveChair key={`right2-${i}`} position={[x, 0, -2.2]} rotation={[0, 0, 0]} accentColor="#3b82f6" />
                ))}
            </group>

            {/* Break area with standing tables */}
            <group position={[0, 0, 18]}>
                <StandingTable position={[-3, 0, 0]} accentColor="#22c55e" />
                <StandingTable position={[0, 0, 0]} accentColor="#22c55e" />
                <StandingTable position={[3, 0, 0]} accentColor="#22c55e" />
            </group>

            {/* Planters throughout */}
            <TechPlanter position={[-12, 0, -15]} size={1.5} />
            <TechPlanter position={[12, 0, -15]} size={1.5} />
            <TechPlanter position={[-20, 0, 10]} size={2} />
            <TechPlanter position={[20, 0, 10]} size={2} />
            <TechPlanter position={[0, 0, 10]} size={1.8} />
        </group>
    );
};

// WHITEBOARD - Infinite Canvas / Miro Killer Room
export const WhiteboardFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Expansive ceiling lighting for clear visibility */}
            <CeilingPanel position={[0, 12, 0]} size={[15, 15]} color="#ffffff" />
            <CeilingPanel position={[-15, 12, 0]} size={[8, 8]} color={accentColor} />
            <CeilingPanel position={[15, 12, 0]} size={[8, 8]} color={accentColor} />
            <CeilingPanel position={[0, 12, -15]} size={[10, 6]} color="#8b5cf6" />
            <CeilingPanel position={[0, 12, 15]} size={[10, 6]} color="#22c55e" />

            {/* Main presentation wall display */}
            <HoloDisplay
                position={[0, 5, -18]}
                rotation={[0, 0, 0]}
                size={[12, 6]}
                color={accentColor}
                label="MAIN CANVAS"
            />

            {/* Side displays for context */}
            <HoloDisplay
                position={[-18, 4, 0]}
                rotation={[0, Math.PI / 2, 0]}
                size={[8, 5]}
                color="#8b5cf6"
                label="REFERENCE"
            />
            <HoloDisplay
                position={[18, 4, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                size={[8, 5]}
                color="#22c55e"
                label="TIMELINE"
            />

            {/* Collaboration pods around the infinite canvas */}
            {/* Pod 1 - Top left */}
            <group position={[-10, 0, -10]}>
                <StandingTable position={[0, 0, 0]} accentColor="#ec4899" />
            </group>

            {/* Pod 2 - Top right */}
            <group position={[10, 0, -10]}>
                <StandingTable position={[0, 0, 0]} accentColor="#f59e0b" />
            </group>

            {/* Pod 3 - Bottom left */}
            <group position={[-10, 0, 10]}>
                <StandingTable position={[0, 0, 0]} accentColor="#3b82f6" />
            </group>

            {/* Pod 4 - Bottom right */}
            <group position={[10, 0, 10]}>
                <StandingTable position={[0, 0, 0]} accentColor="#10b981" />
            </group>

            {/* Central facilitator console */}
            <CommandConsole position={[0, 0, 12]} rotation={[0, Math.PI, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[0, 0, 14.5]} rotation={[0, Math.PI, 0]} accentColor={accentColor} />

            {/* Breakout seating around edges */}
            {[-12, 12].map((x) => (
                <group key={x}>
                    <ExecutiveChair position={[x, 0, -5]} rotation={[0, x > 0 ? -Math.PI / 4 : Math.PI / 4, 0]} accentColor={accentColor} />
                    <ExecutiveChair position={[x, 0, 5]} rotation={[0, x > 0 ? -Math.PI * 0.75 : Math.PI * 0.75, 0]} accentColor={accentColor} />
                </group>
            ))}

            {/* Corner planters for ambiance */}
            <TechPlanter position={[-16, 0, -16]} size={2} />
            <TechPlanter position={[16, 0, -16]} size={2} />
            <TechPlanter position={[-16, 0, 16]} size={2} />
            <TechPlanter position={[16, 0, 16]} size={2} />

            {/* Decorative wall panels */}
            <WallPanel position={[-18, 2, -10]} rotation={[0, Math.PI / 2, 0]} size={[3, 1.5]} accentColor="#ec4899" />
            <WallPanel position={[18, 2, -10]} rotation={[0, -Math.PI / 2, 0]} size={[3, 1.5]} accentColor="#f59e0b" />
            <WallPanel position={[-18, 2, 10]} rotation={[0, Math.PI / 2, 0]} size={[3, 1.5]} accentColor="#3b82f6" />
            <WallPanel position={[18, 2, 10]} rotation={[0, -Math.PI / 2, 0]} size={[3, 1.5]} accentColor="#10b981" />
        </group>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚗 LUXURY CAR SHOWROOM - Premium Vehicle Display
// ═══════════════════════════════════════════════════════════════════════════════

// Premium Sports Car Component - McLaren/Porsche inspired design
const LuxuryCar = ({ position, rotation = 0, accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    rotation?: number,
    accentColor?: string
}) => {
    const carRef = useRef<Group>(null);

    useFrame((state) => {
        if (carRef.current) {
            carRef.current.rotation.y += 0.003;
        }
    });

    return (
        <group ref={carRef} position={position} rotation={[0, rotation, 0]} scale={1.2}>
            {/* ═══ MAIN BODY - Aerodynamic shell ═══ */}
            <group>
                {/* Lower body - wide stance */}
                <RoundedBox args={[2.2, 0.35, 4.8]} radius={0.15} smoothness={8} position={[0, 0.35, 0]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#0a0a0e" metalness={0.98} roughness={0.08} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={3} />
                </RoundedBox>

                {/* Upper body curve */}
                <RoundedBox args={[1.9, 0.25, 3.8]} radius={0.12} smoothness={8} position={[0, 0.6, -0.2]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#0a0a0e" metalness={0.98} roughness={0.08} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={3} />
                </RoundedBox>

                {/* Roof/Cabin - teardrop shape */}
                <RoundedBox args={[1.5, 0.45, 1.6]} radius={0.2} smoothness={8} position={[0, 0.95, -0.4]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#050508" metalness={0.95} roughness={0.1} clearcoat={1} clearcoatRoughness={0.1} />
                </RoundedBox>

                {/* Front hood - sculpted */}
                <RoundedBox args={[1.7, 0.12, 1.5]} radius={0.06} smoothness={8} position={[0, 0.65, 1.4]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#0a0a0e" metalness={0.98} roughness={0.06} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={3} />
                </RoundedBox>

                {/* Rear deck */}
                <RoundedBox args={[1.8, 0.1, 1.2]} radius={0.05} smoothness={8} position={[0, 0.62, -1.8]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#0a0a0e" metalness={0.98} roughness={0.08} clearcoat={1} clearcoatRoughness={0.08} />
                </RoundedBox>
            </group>

            {/* ═══ GLASS - Premium transparency ═══ */}
            <group>
                {/* Windshield */}
                <mesh position={[0, 0.98, 0.55]} rotation={[-0.45, 0, 0]}>
                    <planeGeometry args={[1.4, 0.7]} />
                    <meshPhysicalMaterial color="#1a2530" transmission={0.85} opacity={0.5} metalness={0.1} roughness={0} transparent thickness={0.02} />
                </mesh>

                {/* Rear window */}
                <mesh position={[0, 0.95, -1.25]} rotation={[0.35, 0, 0]}>
                    <planeGeometry args={[1.35, 0.55]} />
                    <meshPhysicalMaterial color="#1a2530" transmission={0.85} opacity={0.5} metalness={0.1} roughness={0} transparent thickness={0.02} />
                </mesh>

                {/* Side windows - left */}
                <mesh position={[-0.78, 0.92, -0.35]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[1.1, 0.4]} />
                    <meshPhysicalMaterial color="#1a2530" transmission={0.85} opacity={0.4} metalness={0.1} roughness={0} transparent />
                </mesh>

                {/* Side windows - right */}
                <mesh position={[0.78, 0.92, -0.35]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[1.1, 0.4]} />
                    <meshPhysicalMaterial color="#1a2530" transmission={0.85} opacity={0.4} metalness={0.1} roughness={0} transparent />
                </mesh>
            </group>

            {/* ═══ WHEELS - Premium multi-spoke design ═══ */}
            {[
                [-1.0, 0.32, 1.35],
                [1.0, 0.32, 1.35],
                [-1.0, 0.32, -1.35],
                [1.0, 0.32, -1.35]
            ].map((pos, i) => (
                <group key={i} position={pos as [number, number, number]}>
                    {/* Tire - low profile */}
                    <Cylinder args={[0.32, 0.32, 0.22, 48]} rotation={[0, 0, Math.PI / 2]}>
                        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0} />
                    </Cylinder>

                    {/* Rim - outer ring */}
                    <Cylinder args={[0.28, 0.28, 0.08, 48]} rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? -0.08 : 0.08, 0, 0]}>
                        <meshStandardMaterial color="#2a2a30" metalness={1} roughness={0.15} envMapIntensity={2} />
                    </Cylinder>

                    {/* Rim - center cap */}
                    <Cylinder args={[0.08, 0.08, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? -0.09 : 0.09, 0, 0]}>
                        <meshStandardMaterial color="#1a1a20" metalness={1} roughness={0.2} />
                    </Cylinder>

                    {/* Rim - spokes */}
                    {[0, 1, 2, 3, 4].map((spoke) => (
                        <mesh key={spoke} position={[i % 2 === 0 ? -0.08 : 0.08, 0, 0]} rotation={[0, 0, Math.PI / 2 + (spoke * Math.PI * 2) / 5]}>
                            <boxGeometry args={[0.02, 0.22, 0.04]} />
                            <meshStandardMaterial color="#c0c0c8" metalness={1} roughness={0.1} />
                        </mesh>
                    ))}

                    {/* Brake caliper accent */}
                    <mesh position={[i % 2 === 0 ? 0.05 : -0.05, 0.08, 0]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[0.05, 0.08, 0.12]} />
                        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
                    </mesh>
                </group>
            ))}

            {/* ═══ LIGHTING - Premium LED signature ═══ */}
            <group>
                {/* Headlights - DRL strip */}
                <mesh position={[0.65, 0.48, 2.35]}>
                    <RoundedBox args={[0.35, 0.06, 0.03]} radius={0.02} smoothness={4}>
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </RoundedBox>
                </mesh>
                <mesh position={[-0.65, 0.48, 2.35]}>
                    <RoundedBox args={[0.35, 0.06, 0.03]} radius={0.02} smoothness={4}>
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </RoundedBox>
                </mesh>
                <pointLight position={[0, 0.5, 2.8]} intensity={3} distance={10} color="#ffffff" />

                {/* Taillights - light bar */}
                <mesh position={[0, 0.55, -2.4]}>
                    <RoundedBox args={[1.6, 0.04, 0.02]} radius={0.01} smoothness={4}>
                        <meshBasicMaterial color="#ff2020" toneMapped={false} />
                    </RoundedBox>
                </mesh>

                {/* Taillight accents */}
                <mesh position={[0.7, 0.52, -2.38]}>
                    <boxGeometry args={[0.2, 0.1, 0.02]} />
                    <meshBasicMaterial color="#ff1a1a" toneMapped={false} />
                </mesh>
                <mesh position={[-0.7, 0.52, -2.38]}>
                    <boxGeometry args={[0.2, 0.1, 0.02]} />
                    <meshBasicMaterial color="#ff1a1a" toneMapped={false} />
                </mesh>
            </group>

            {/* ═══ DETAILS - Premium touches ═══ */}
            <group>
                {/* Side mirrors */}
                <RoundedBox args={[0.08, 0.06, 0.12]} radius={0.02} smoothness={4} position={[-1.05, 0.85, 0.3]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#0a0a0e" metalness={0.98} roughness={0.08} clearcoat={1} />
                </RoundedBox>
                <RoundedBox args={[0.08, 0.06, 0.12]} radius={0.02} smoothness={4} position={[1.05, 0.85, 0.3]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="#0a0a0e" metalness={0.98} roughness={0.08} clearcoat={1} />
                </RoundedBox>

                {/* Door handles - flush */}
                <mesh position={[-1.1, 0.58, -0.1]}>
                    <boxGeometry args={[0.02, 0.02, 0.15]} />
                    <ChromeMaterial />
                </mesh>
                <mesh position={[1.1, 0.58, -0.1]}>
                    <boxGeometry args={[0.02, 0.02, 0.15]} />
                    <ChromeMaterial />
                </mesh>

                {/* Rear spoiler - active aero */}
                <RoundedBox args={[1.7, 0.03, 0.2]} radius={0.01} smoothness={4} position={[0, 0.85, -2.1]} castShadow receiveShadow>
                    <CarbonFiberMaterial />
                </RoundedBox>
                <mesh position={[0.65, 0.78, -2.0]}>
                    <boxGeometry args={[0.04, 0.14, 0.08]} />
                    <CarbonFiberMaterial />
                </mesh>
                <mesh position={[-0.65, 0.78, -2.0]}>
                    <boxGeometry args={[0.04, 0.14, 0.08]} />
                    <CarbonFiberMaterial />
                </mesh>

                {/* Front splitter */}
                <RoundedBox args={[2.0, 0.025, 0.3]} radius={0.01} smoothness={4} position={[0, 0.2, 2.3]} castShadow receiveShadow>
                    <CarbonFiberMaterial />
                </RoundedBox>

                {/* Side skirts */}
                <mesh position={[-1.08, 0.22, 0]}>
                    <boxGeometry args={[0.04, 0.08, 3.8]} />
                    <CarbonFiberMaterial />
                </mesh>
                <mesh position={[1.08, 0.22, 0]}>
                    <boxGeometry args={[0.04, 0.08, 3.8]} />
                    <CarbonFiberMaterial />
                </mesh>
            </group>

            {/* ═══ UNDERGLOW - Signature accent ═══ */}
            <mesh position={[0, 0.08, 0]}>
                <planeGeometry args={[1.8, 4.2]} />
                <meshBasicMaterial color={accentColor} transparent opacity={0.6} side={2} />
            </mesh>
            <pointLight position={[0, 0.05, 0]} intensity={1.5} distance={2.5} color={accentColor} />
            <pointLight position={[0, 0.05, 1.5]} intensity={0.8} distance={2} color={accentColor} />
            <pointLight position={[0, 0.05, -1.5]} intensity={0.8} distance={2} color={accentColor} />
        </group>
    );
};

// Rotating Display Platform
const DisplayPlatform = ({ position, size = 5, accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    size?: number,
    accentColor?: string
}) => (
    <group position={position}>
        {/* Main platform */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
            <cylinderGeometry args={[size, size + 0.2, 0.2, 64]} />
            <meshStandardMaterial color="#0a0a0f" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Inner ring */}
        <mesh position={[0, 0.21, 0]}>
            <cylinderGeometry args={[size - 0.3, size - 0.3, 0.02, 64]} />
            <meshStandardMaterial color="#15151f" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Outer glow ring */}
        <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size - 0.1, size, 64]} />
            <NeonMaterial color={accentColor} />
        </mesh>

        {/* Inner glow ring */}
        <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size - 1.5, size - 1.3, 64]} />
            <NeonMaterial color={accentColor} />
        </mesh>
    </group>
);

// Spotlight fixture
const Spotlight = ({ position, target, color = "#ffffff" }: {
    position: [number, number, number],
    target: [number, number, number],
    color?: string
}) => (
    <group position={position}>
        <mesh>
            <cylinderGeometry args={[0.2, 0.4, 0.5, 16]} />
            <meshStandardMaterial color="#1a1a1f" metalness={0.8} roughness={0.3} />
        </mesh>
        <spotLight position={[0, -0.3, 0]} angle={0.4} penumbra={0.5} intensity={3} distance={20} color={color} castShadow receiveShadow />
    </group>
);

export const ShowroomFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Ambient ceiling lighting */}
            <CeilingPanel position={[0, 12, 0]} size={[6, 6]} color="#ffffff" />
            <CeilingPanel position={[-12, 12, 0]} size={[4, 4]} color={accentColor} />
            <CeilingPanel position={[12, 12, 0]} size={[4, 4]} color={accentColor} />

            {/* Main rotating display platform with car */}
            <DisplayPlatform position={[0, 0, 0]} size={6} accentColor={accentColor} />
            <LuxuryCar position={[0, 0.22, 0]} accentColor={accentColor} />

            {/* Dramatic spotlights */}
            <Spotlight position={[-6, 10, -6]} target={[0, 0, 0]} color="#ffffff" />
            <Spotlight position={[6, 10, -6]} target={[0, 0, 0]} color="#ffffff" />
            <Spotlight position={[0, 10, 6]} target={[0, 0, 0]} color={accentColor} />

            {/* Info displays around the showroom */}
            <HoloDisplay position={[-10, 3, 0]} rotation={[0, Math.PI / 2, 0]} size={[4, 2.5]} color={accentColor} label="SPECIFICATIONS" />
            <HoloDisplay position={[10, 3, 0]} rotation={[0, -Math.PI / 2, 0]} size={[4, 2.5]} color={accentColor} label="PERFORMANCE" />
            <HoloDisplay position={[0, 3.5, -10]} rotation={[0, 0, 0]} size={[6, 3]} color={accentColor} label="GALLERY" />

            {/* Viewer seating */}
            <ExecutiveChair position={[-4, 0, 8]} rotation={[0, 0.3, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[0, 0, 9]} rotation={[0, 0, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[4, 0, 8]} rotation={[0, -0.3, 0]} accentColor={accentColor} />

            {/* Sales console */}
            <CommandConsole position={[8, 0, 8]} rotation={[0, -Math.PI / 4, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[9.5, 0, 9.5]} rotation={[0, -Math.PI / 4, 0]} accentColor={accentColor} />

            {/* Decorative elements */}
            <TechPlanter position={[-10, 0, -10]} size={2} />
            <TechPlanter position={[10, 0, -10]} size={2} />
            <TechPlanter position={[-10, 0, 10]} size={2} />
            <TechPlanter position={[10, 0, 10]} size={2} />

            {/* Wall branding panels */}
            <WallPanel position={[-15, 4, 0]} rotation={[0, Math.PI / 2, 0]} size={[8, 4]} accentColor={accentColor} />
            <WallPanel position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]} size={[8, 4]} accentColor={accentColor} />
        </group>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 COMMAND CENTER - NASA/NATO Tactical Operations
// ═══════════════════════════════════════════════════════════════════════════════

// Large curved display wall
const CurvedDisplayWall = ({ position, accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    accentColor?: string
}) => (
    <group position={position}>
        {/* Main curved structure */}
        <mesh castShadow receiveShadow>
            <cylinderGeometry args={[12, 12, 6, 32, 1, true, Math.PI * 0.7, Math.PI * 0.6]} />
            <meshStandardMaterial color="#0a0a10" metalness={0.7} roughness={0.3} side={2} />
        </mesh>

        {/* Screen panels arranged on the curve */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((offset, i) => (
            <HoloDisplay
                key={i}
                position={[Math.sin(offset) * 11.5, 2, Math.cos(offset) * 11.5 - 12]}
                rotation={[0, offset, 0]}
                size={[3, 2]}
                color={i === 2 ? accentColor : "#22c55e"}
                label={['INTEL', 'COMMS', 'MAIN OPS', 'TACTICAL', 'STATUS'][i]}
            />
        ))}

        {/* Center main screen */}
        <HoloDisplay position={[0, 4.5, -11.5]} rotation={[0, 0, 0]} size={[8, 4]} color={accentColor} label="COMMAND OVERVIEW" />
    </group>
);

// Operator station
const OperatorStation = ({ position, rotation = [0, 0, 0], accentColor = "#0ea5e9" }: {
    position: [number, number, number],
    rotation?: [number, number, number],
    accentColor?: string
}) => (
    <group position={position} rotation={rotation}>
        {/* Desk with embedded displays */}
        <RoundedBox args={[2.5, 0.1, 1]} radius={0.02} smoothness={4} position={[0, 0.85, 0]} castShadow receiveShadow>
            <MatteBlackMaterial />
        </RoundedBox>

        {/* Desk base */}
        <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[2.3, 0.8, 0.8]} />
            <BrushedMetalMaterial color="#12121a" />
        </mesh>

        {/* Embedded screen on desk */}
        <mesh position={[0, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2, 0.8]} />
            <meshStandardMaterial color="#0a1520" emissive={accentColor} emissiveIntensity={0.2} />
        </mesh>

        {/* Desk accent light */}
        <mesh position={[0, 0.87, 0.48]}>
            <boxGeometry args={[2.2, 0.01, 0.02]} />
            <NeonMaterial color={accentColor} />
        </mesh>

        {/* Vertical monitor */}
        <HoloDisplay position={[0, 1.6, -0.3]} rotation={[-0.1, 0, 0]} size={[1.5, 1]} color={accentColor} label="TERMINAL" />
    </group>
);

export const CommandCenterFurniture = ({ accentColor, furnitureMap }: FurnitureProps) => {
    return (
        <group>
            {/* Dramatic ceiling lighting */}
            <CeilingPanel position={[0, 12, -6]} size={[12, 4]} color={accentColor} />
            <CeilingPanel position={[-8, 12, 4]} size={[4, 4]} color="#22c55e" />
            <CeilingPanel position={[8, 12, 4]} size={[4, 4]} color="#f59e0b" />

            {/* Main curved display wall */}
            <CurvedDisplayWall position={[0, 0, 0]} accentColor={accentColor} />

            {/* Tiered operator stations */}
            {/* Front row - 3 stations */}
            <OperatorStation position={[-4, 0, 2]} rotation={[0, 0.2, 0]} accentColor={accentColor} />
            <OperatorStation position={[0, 0, 3]} rotation={[0, 0, 0]} accentColor={accentColor} />
            <OperatorStation position={[4, 0, 2]} rotation={[0, -0.2, 0]} accentColor={accentColor} />

            {/* Back row - 2 stations on raised platform */}
            <mesh position={[0, 0.15, 7]} receiveShadow>
                <boxGeometry args={[10, 0.3, 4]} />
                <BrushedMetalMaterial color="#0a0a10" />
            </mesh>
            <OperatorStation position={[-3, 0.3, 7]} rotation={[0, 0.1, 0]} accentColor="#22c55e" />
            <OperatorStation position={[3, 0.3, 7]} rotation={[0, -0.1, 0]} accentColor="#f59e0b" />

            {/* Command chairs */}
            <ExecutiveChair position={[-4, 0, 4]} rotation={[0, 0.2, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[0, 0, 5]} rotation={[0, 0, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[4, 0, 4]} rotation={[0, -0.2, 0]} accentColor={accentColor} />
            <ExecutiveChair position={[-3, 0.3, 9]} rotation={[0, 0.1, 0]} accentColor="#22c55e" />
            <ExecutiveChair position={[3, 0.3, 9]} rotation={[0, -0.1, 0]} accentColor="#f59e0b" />

            {/* Side info panels */}
            <WallPanel position={[-14, 3, 0]} rotation={[0, Math.PI / 2, 0]} size={[6, 3]} accentColor="#ef4444" />
            <WallPanel position={[14, 3, 0]} rotation={[0, -Math.PI / 2, 0]} size={[6, 3]} accentColor="#3b82f6" />

            {/* Floor accent lighting */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[8, 8.1, 64]} />
                <NeonMaterial color={accentColor} />
            </mesh>
            <mesh position={[0, 0.02, 7]} rotation={[-Math.PI / 2, 0, 0]}>
                <boxGeometry args={[8, 0.1, 0.05]} />
                <NeonMaterial color={accentColor} />
            </mesh>
        </group>
    );
};