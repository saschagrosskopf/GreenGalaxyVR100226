import React, { useEffect, useRef, Suspense } from 'react';
import { useThree } from '@react-three/fiber';
import { PivotControls, Text, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { colyseusService, ScreenState } from '../../services/colyseus/ColyseusService';

interface ScreenPlaneProps {
    screenState: ScreenState;
    isPresenter: boolean;
    stream?: MediaStream;
}

/**
 * 🖥️ Screen Content Component (The actual mesh with the video)
 */
const ScreenContent: React.FC<{ stream?: MediaStream; isPresenter: boolean }> = ({ stream, isPresenter }) => {
    const textureRef = useRef<THREE.VideoTexture | null>(null);
    const [hasTexture, setHasTexture] = React.useState(false);

    useEffect(() => {
        if (!stream) {
            setHasTexture(false);
            return;
        }

        console.log("🖥️ ScreenContent: Creating Video Texture for stream", stream.id);

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = "anonymous";

        // Firefox/Chrome interaction fix
        const playVideo = () => {
            video.play().catch(err => {
                console.warn("🖥️ ScreenContent: Video play failed, retrying on interaction...", err);
            });
        };

        video.onloadedmetadata = () => {
            console.log("🖥️ ScreenContent: Video metadata loaded", video.videoWidth, "x", video.videoHeight);
            playVideo();
        };

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        textureRef.current = texture;
        setHasTexture(true);

        return () => {
            console.log("🖥️ ScreenContent: Cleaning up Video Texture");
            video.pause();
            video.srcObject = null;
            texture.dispose();
            textureRef.current = null;
            setHasTexture(false);
        };
    }, [stream]);

    const aspectRatio = 16 / 9;
    const baseWidth = 3;
    const baseHeight = 3 / aspectRatio;

    return (
        <mesh>
            <planeGeometry args={[baseWidth, baseHeight]} />
            {hasTexture && textureRef.current ? (
                <meshBasicMaterial map={textureRef.current} toneMapped={false} side={THREE.DoubleSide} />
            ) : (
                <meshBasicMaterial color="#050505" side={THREE.DoubleSide} />
            )}
            {!hasTexture && (
                <Text position={[0, 0, 0.01]} fontSize={0.2} color="white">
                    {isPresenter ? "Sharing Screen..." : "Waiting for Presenter..."}
                </Text>
            )}
        </mesh>
    );
};

/**
 * 🖥️ Main ScreenPlane Component (Handles Colyseus sync and PivotControls)
 */
const ScreenPlane: React.FC<ScreenPlaneProps> = ({ screenState, isPresenter, stream }) => {
    const meshRef = useRef<THREE.Group>(null);

    useEffect(() => {
        console.log("🖥️ ScreenPlane: Mount", { isPresenter, active: screenState.active, presenterId: screenState.presenterId });
        console.log("🖥️ ScreenPlane: Position", [screenState.x, screenState.y, screenState.z]);
    }, []);

    // Sync transform to server when presenter finishes dragging
    const handleDragEnd = () => {
        if (meshRef.current) {
            const p = new THREE.Vector3();
            const q = new THREE.Quaternion();
            const s = new THREE.Vector3();

            // Get world transform of the group
            meshRef.current.getWorldPosition(p);
            meshRef.current.getWorldQuaternion(q);
            meshRef.current.getWorldScale(s);

            const euler = new THREE.Euler().setFromQuaternion(q);

            console.log("📡 ScreenPlane: Syncing to Server", { p, euler, s });
            colyseusService.sendScreenTransform({
                x: p.x, y: p.y, z: p.z,
                rx: euler.x, ry: euler.y, rz: euler.z,
                scale: s.x
            });
        }
    };

    if (isPresenter) {
        return (
            <PivotControls
                scale={150}
                lineWidth={4}
                fixed
                anchor={[0, 0, 0]}
                onDragEnd={handleDragEnd}
            >
                {/* We wrap Content in a group to read its world transform easily */}
                <group
                    ref={meshRef}
                    position={[screenState.x, screenState.y, screenState.z]}
                    rotation={[screenState.rx, screenState.ry, screenState.rz]}
                    scale={[screenState.scale, screenState.scale, screenState.scale]}
                >
                    <Suspense fallback={
                        <mesh>
                            <planeGeometry args={[3, 1.68]} />
                            <meshBasicMaterial color="#111" />
                            <Text position={[0, 0, 0.01]} fontSize={0.1}>Loading Video...</Text>
                        </mesh>
                    }>
                        <ScreenContent stream={stream} isPresenter={true} />
                    </Suspense>
                </group>
            </PivotControls>
        );
    }

    // Spectator Mode
    return (
        <group
            position={[screenState.x, screenState.y, screenState.z]}
            rotation={[screenState.rx, screenState.ry, screenState.rz]}
            scale={[screenState.scale, screenState.scale, screenState.scale]}
        >
            <Suspense fallback={null}>
                <ScreenContent stream={stream} isPresenter={false} />
            </Suspense>
        </group>
    );
};

export default ScreenPlane;
