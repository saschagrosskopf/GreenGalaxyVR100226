import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, Group } from 'three';

interface Props {
  name: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  avatarUrl?: string;
  isSelf?: boolean;
}

/**
 * 🎭 BUSINESS AVATAR - Professional Executive Style
 * Pure Three.js geometry - No external models needed
 * Design: Sleek holographic business professional
 */
const Avatar: React.FC<Props> = ({ name, color, position, rotation, avatarUrl, isSelf = false }) => {
  const group = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const pulseRef = useRef<any>(null);

  // 1. Smooth Network Interpolation (Movement)
  useFrame((state, delta) => {
    if (!isSelf && group.current) {
      // Lerp towards target position
      group.current.position.lerp(new Vector3(...position), 5 * delta);
    }

    // 2. Idle Animation (Subtle breathing + hover)
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      bodyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }

    // 3. Pulse ring animation
    if (pulseRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      pulseRef.current.scale.setScalar(1 + pulse * 0.2);
      pulseRef.current.material.opacity = 0.3 + pulse * 0.3;
    }
  });

  // Don't render self-avatar body in 1st person (prevents clipping)
  if (isSelf) return null;

  return (
    <group ref={group} position={position}>
      <group ref={bodyRef}>

        {/* === PROFESSIONAL BUSINESS AVATAR === */}

        {/* 1. BASE PLATFORM - Holographic standing pad */}
        <group position={[0, 0.02, 0]}>
          {/* Outer ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Inner glow disc */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[0.35, 32]} />
            <meshStandardMaterial
              color="#1a1a2e"
              transparent
              opacity={0.8}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Pulse ring */}
          <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.42, 0.44, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        </group>

        {/* 2. LEGS - Slim professional trousers */}
        <group position={[0, 0.5, 0]}>
          {/* Left leg */}
          <mesh position={[-0.08, 0, 0]}>
            <capsuleGeometry args={[0.06, 0.5, 8, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.1} />
          </mesh>
          {/* Right leg */}
          <mesh position={[0.08, 0, 0]}>
            <capsuleGeometry args={[0.06, 0.5, 8, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.1} />
          </mesh>
          {/* Shoes */}
          <mesh position={[-0.08, -0.3, 0.02]}>
            <boxGeometry args={[0.08, 0.06, 0.15]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0.08, -0.3, 0.02]}>
            <boxGeometry args={[0.08, 0.06, 0.15]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>

        {/* 3. TORSO - Business suit jacket */}
        <group position={[0, 1.1, 0]}>
          {/* Main torso */}
          <mesh>
            <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
          {/* Suit lapels / collar accent */}
          <mesh position={[0, 0.15, 0.12]}>
            <boxGeometry args={[0.25, 0.15, 0.08]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          {/* Tie / accent stripe */}
          <mesh position={[0, 0, 0.17]}>
            <boxGeometry args={[0.04, 0.35, 0.02]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>

        {/* 4. ARMS */}
        <group position={[0, 1.1, 0]}>
          {/* Left arm */}
          <mesh position={[-0.25, -0.05, 0]} rotation={[0, 0, 0.15]}>
            <capsuleGeometry args={[0.05, 0.35, 8, 16]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          {/* Right arm */}
          <mesh position={[0.25, -0.05, 0]} rotation={[0, 0, -0.15]}>
            <capsuleGeometry args={[0.05, 0.35, 8, 16]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          {/* Hands */}
          <mesh position={[-0.28, -0.28, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#e2c4a8" roughness={0.5} />
          </mesh>
          <mesh position={[0.28, -0.28, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#e2c4a8" roughness={0.5} />
          </mesh>
        </group>

        {/* 5. NECK */}
        <mesh position={[0, 1.45, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.1, 16]} />
          <meshStandardMaterial color="#e2c4a8" roughness={0.6} />
        </mesh>

        {/* 6. HEAD - Professional look */}
        <group position={[0, 1.65, 0]}>
          {/* Head base */}
          <mesh>
            <sphereGeometry args={[0.14, 32, 32]} />
            <meshStandardMaterial
              color="#e8d5c4"
              roughness={0.5}
              metalness={0.05}
            />
          </mesh>

          {/* Hair */}
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2d1b0e" roughness={0.8} />
          </mesh>

          {/* Smart glasses / visor - tech executive look */}
          <mesh position={[0, 0.02, 0.12]}>
            <boxGeometry args={[0.22, 0.04, 0.03]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Glasses frame */}
          <mesh position={[0, 0.02, 0.11]}>
            <boxGeometry args={[0.24, 0.05, 0.01]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* 7. STATUS INDICATOR - Active ring above head */}
        <mesh position={[0, 1.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.015, 8, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
          />
        </mesh>

      </group>

      {/* --- NAME TAG (Holographic 3D Text) --- */}
      <group position={[0, 2.1, 0]}>
        {/* Background panel */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[name.length * 0.12 + 0.3, 0.25]} />
          <meshStandardMaterial
            color="#0f172a"
            transparent
            opacity={0.85}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        {/* Accent line */}
        <mesh position={[0, -0.1, -0.01]}>
          <planeGeometry args={[name.length * 0.12 + 0.2, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {/* Name text */}
        <Text
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {name || "Guest"}
        </Text>
      </group>

      {/* Role badge */}
      <group position={[0, 1.95, 0.2]}>
        <Text
          fontSize={0.06}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          ● ONLINE
        </Text>
      </group>
    </group>
  );
};

export default Avatar;