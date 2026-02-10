/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏠 VR ROOM - ENTERPRISE MULTIPLAYER EDITION
 * Premium immersive collaboration with Ready Player Me avatars, chat, and emotes
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Text, Box, Sphere, Gltf, Cylinder, RoundedBox, MeshReflectorMaterial } from '@react-three/drei';
import { api, SceneObject, CURRENT_TEMPLATE_VERSION } from '../../services/api';
import { generatePlayerId, VR_SAFETY_LIMITS, clampCameraPosition, isValidModelUrl } from '../../services/security';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BoardroomFurniture, StudioFurniture, FullOfficeLayout, ZenFurniture, ExpoFurniture, WhiteboardFurniture, ShowroomFurniture, CommandCenterFurniture } from './Furniture';
import { SmartScreen } from './SmartScreen';
import { InfiniteCanvas } from './InfiniteCanvas';
import Avatar from './Avatar';
import { RPMAvatar, ChatBubble, NameTag, DEFAULT_AVATARS } from './RPMAvatar';
import { RoomConfig, AppMode, Asset, User, Space } from '../../types';
import { UseMultiplayerResult } from '../../hooks/useMultiplayer';
// @ts-ignore
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy, getDocs } from 'firebase/firestore';
// @ts-ignore
import { db, getSessionId } from '../../logic';
import { colyseusService, ScreenState } from '../../services/colyseus/ColyseusService';
import { screenShareService } from '../../services/ScreenShareService';
import ScreenPlane from './ScreenPlane';

// 🛠️ UTILS
const lerpAngle = (a: number, b: number, t: number) => {
    const d = b - a;
    const wrapped = ((((d % (Math.PI * 2)) + (Math.PI * 3)) % (Math.PI * 2)) - Math.PI);
    return a + wrapped * t;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface OtherPlayer {
    id: string;
    name: string;
    color: string;
    position: [number, number, number];
    rotation: [number, number, number];
    avatarUrl?: string;
    lastSeen: number;
}

interface Props {
    templateId?: string;
    config: RoomConfig;
    assets?: Asset[];
    user: User | undefined;
    hasEntered: boolean;
    spaceId?: string;
    activeTool?: 'cursor' | 'select' | 'sticky' | 'shape' | 'text' | 'connector' | 'frame' | 'sticker' | 'eraser' | 'vote' | 'model';
    toolPayload?: string;
    customGlbUrl?: string;
    colliderGlbUrl?: string;
    isFullEnvironment?: boolean;
    useColyseusMultiplayer?: boolean;
    colyseusServerUrl?: string;
    currentEmote?: string;
    cameraMode?: 'first' | 'third';
    onSelectAvatar?: (avatarId: string) => void;
    multiplayer: UseMultiplayerResult;
    space?: Space;
    enableReflections?: boolean;
    onUpdateUser?: (updates: Partial<User>) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 MAIN ROOM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const Room: React.FC<Props> = ({
    templateId = 'template_boardroom',
    config,
    assets,
    user,
    hasEntered,
    spaceId,
    activeTool,
    toolPayload,
    customGlbUrl,
    colliderGlbUrl,
    isFullEnvironment,
    useColyseusMultiplayer = false,
    colyseusServerUrl,
    currentEmote,
    cameraMode = 'first',
    onSelectAvatar,
    multiplayer,
    space,
    enableReflections = true,
    onUpdateUser
}) => {
    // ⚙️ TWEAKABLE MOVEMENT & CAMERA SETTINGS
    const MOVEMENT_SPEED = 5.0;
    const CAMERA_SMOOTHING = 0.08;
    const ROTATION_SMOOTHING = 0.15;
    const CHARACTER_ROTATION_OFFSET = Math.PI;

    // 🛠️ GROUNDING & COLLISIONS
    const GROUND_RAY_ORIGIN_HEIGHT = 2.0; // Shoot from 2m above
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const colliderMeshRef = useRef<THREE.Group>(null);

    const { camera } = useThree();
    const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatBubbles, setChatBubbles] = useState<Map<string, string>>(new Map());
    const primaryColor = config.wallColor || '#06B6D4';

    // Chat Bubble logic
    useEffect(() => {
        const lastMsg = multiplayer.chatMessages[multiplayer.chatMessages.length - 1];
        if (lastMsg) {
            setChatBubbles(prev => {
                const next = new Map(prev);
                next.set(lastMsg.id, lastMsg.text);
                return next;
            });
            setTimeout(() => {
                setChatBubbles(prev => {
                    const next = new Map(prev);
                    next.delete(lastMsg.id);
                    return next;
                });
            }, 5000);
        }
    }, [multiplayer.chatMessages]);

    const isFullGlbMode = isFullEnvironment ||
        (templateId === 'custom' && !!customGlbUrl);

    const myId = useRef(getSessionId());
    const lastBroadcast = useRef(0);
    const keys = useRef<{ [key: string]: boolean }>({});
    const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
        const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) keys.current['Mouse0'] = true; };
        const handleMouseUp = (e: MouseEvent) => { if (e.button === 0) keys.current['Mouse0'] = false; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // 🖥️ 3D SCREEN SHARING
    const [screenState, setScreenState] = useState<ScreenState | undefined>(undefined);
    const [screenStream, setScreenStream] = useState<MediaStream | undefined>(undefined);

    useEffect(() => {
        // 1. Listen to Colyseus State (Position, Rotation, Presenter ID)
        colyseusService.setOnScreenChange((state) => {
            setScreenState(state);
        });

        // 2. Listen to Media Stream (from WebRTC service)
        // If I am presenting:
        screenShareService.setCallbacks({
            onStartSharing: (stream) => setScreenStream(stream),
            onStopSharing: () => setScreenStream(undefined),
            onRemoteShare: (peerId, stream) => setScreenStream(stream),
            onRemoteShareEnd: () => setScreenStream(undefined)
        });

        // Check if I am already presenting (re-mount case)
        if (screenShareService.isScreenSharing()) {
            setScreenStream(screenShareService.getLocalStream() || undefined);
        }

    }, []);

    useEffect(() => {
        if (!spaceId) return;
        const objectsRef = collection(db, 'spaces', spaceId, 'sceneObjects');
        const q = query(objectsRef, orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, async (snapshot: any) => {
            const objs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
            if (snapshot.empty && isLoading) {
                await api.spaces.hydrateSpace(spaceId, templateId);
            }
            setSceneObjects(objs);
            // Expose for serialization engine
            (window as any).sceneObjects = objs;
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [spaceId, templateId]);

    const playerPos = useRef(new THREE.Vector3(0, 1, 0));
    const hasSetInitialPos = useRef(false);

    useEffect(() => {
        if (hasEntered && !hasSetInitialPos.current && (space as any)?.spawnPoint) {
            const sp = (space as any).spawnPoint;
            playerPos.current.set(sp[0], sp[1], sp[2]);
            hasSetInitialPos.current = true;
        }
    }, [hasEntered, space]);

    const localPlayerRef = useRef<THREE.Group>(null);
    const cameraDistance = useRef(3);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            cameraDistance.current = Math.max(1, Math.min(8, cameraDistance.current + e.deltaY * 0.005));
        };
        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // 🧍 LOCAL PLAYER AVATAR
    const [localAvatarScene, setLocalAvatarScene] = useState<THREE.Group | null>(null);
    const lastAvatarUrl = useRef<string>('');
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
    const [currentAnim, setCurrentAnim] = useState<'idle' | 'walk'>('idle');

    useEffect(() => {
        const url = DEFAULT_AVATARS[user?.avatarUrl as string] || DEFAULT_AVATARS['a1'];
        if (url === lastAvatarUrl.current) return;
        lastAvatarUrl.current = url;

        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            const scene = gltf.scene;
            scene.traverse(c => {
                if ((c as THREE.Mesh).isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            });

            const mixer = new THREE.AnimationMixer(scene);
            mixerRef.current = mixer;
            setLocalAvatarScene(scene);

            const animFiles = ['Idle', 'Walk', 'Wave'];
            animFiles.forEach(filename => {
                loader.load(`/assets/avatars/${filename}.glb`, (animGltf) => {
                    const clip = animGltf.animations[0];
                    if (clip) {
                        const name = filename.toLowerCase();
                        const action = mixer.clipAction(clip);
                        actionsRef.current[name] = action;
                        if (name === 'idle') action.play();
                    }
                });
            });
        });

        return () => {
            mixerRef.current?.stopAllAction();
            mixerRef.current = null;
        };
    }, [user?.avatarUrl]);

    useEffect(() => {
        const emoteKey = currentEmote?.toLowerCase();
        if (!emoteKey || !actionsRef.current[emoteKey]) return;

        const action = actionsRef.current[emoteKey];
        const idleAction = actionsRef.current['idle'];
        const walkAction = actionsRef.current['walk'];

        // Helper to get currently active base action
        const getBaseAction = () => {
            if (currentAnim === 'walk' && walkAction) return walkAction;
            return idleAction;
        };

        const baseAction = getBaseAction();

        if (action) {
            // 1. Fade out current base animation to prevent "halfway" blending
            if (baseAction) baseAction.fadeOut(0.2);

            // 2. Play the emote
            action.reset()
                .setLoop(THREE.LoopOnce, 1)
                .fadeIn(0.2)
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .play();

            // 3. Listen for finish to return to base state
            const onFinished = (e: any) => {
                if (e.action === action) {
                    action.fadeOut(0.2);
                    if (baseAction) {
                        baseAction.reset().fadeIn(0.2).play();
                    }
                    mixerRef.current?.removeEventListener('finished', onFinished);
                }
            };

            mixerRef.current?.addEventListener('finished', onFinished);
        }

        return () => {
            // Cleanup if component unmounts or emote changes mid-flight
            // Note: We don't remove the event listener here blindly because it might be for a previous action completion
            // but strictly speaking, if emote changes, we might want to cancel the previous 'finished' logic.
            // For now, the closure safeguards it mostly.
        };
    }, [currentEmote]);

    useFrame((state, delta) => {
        if (!hasEntered) return;
        if (mixerRef.current) mixerRef.current.update(delta);

        const safeDelta = Math.min(delta, 0.1);
        const baseSpeed = cameraMode === 'third' ? 3.0 : 6.0;
        const speed = Math.min(baseSpeed * safeDelta, VR_SAFETY_LIMITS.MAX_MOVEMENT_SPEED * safeDelta);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0; forward.normalize();

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0; right.normalize();

        const moveVector = new THREE.Vector3(0, 0, 0);
        if (keys.current['ArrowUp'] || keys.current['KeyW']) moveVector.add(forward);
        if (keys.current['ArrowDown'] || keys.current['KeyS']) moveVector.sub(forward);
        if (keys.current['ArrowLeft'] || keys.current['KeyA']) moveVector.sub(right);
        if (keys.current['ArrowRight'] || keys.current['KeyD']) moveVector.add(right);

        const isMoving = moveVector.lengthSq() > 0;
        if (isMoving) {
            moveVector.normalize().multiplyScalar(speed);
            playerPos.current.add(moveVector);
        }

        if (mixerRef.current && actionsRef.current['idle'] && actionsRef.current['walk']) {
            if (isMoving && currentAnim === 'idle') {
                actionsRef.current['idle'].fadeOut(0.2);
                actionsRef.current['walk'].reset().fadeIn(0.2).play();
                setCurrentAnim('walk');
            } else if (!isMoving && currentAnim === 'walk') {
                actionsRef.current['walk'].fadeOut(0.2);
                actionsRef.current['idle'].reset().fadeIn(0.2).play();
                setCurrentAnim('idle');
            }
        }

        const [safeX, safeY, safeZ] = clampCameraPosition(playerPos.current.x, playerPos.current.y, playerPos.current.z);
        if (!isNaN(safeX)) playerPos.current.set(safeX, safeY, safeZ);

        // 🛠️ GROUNDING LOGIC
        if (colliderMeshRef.current) {
            raycaster.set(
                new THREE.Vector3(playerPos.current.x, playerPos.current.y + GROUND_RAY_ORIGIN_HEIGHT, playerPos.current.z),
                new THREE.Vector3(0, -1, 0)
            );
            const intersections = raycaster.intersectObjects(colliderMeshRef.current.children, true);
            if (intersections.length > 0) {
                const groundY = intersections[0].point.y;
                playerPos.current.y = groundY;
            }
        }

        if (localPlayerRef.current) {
            localPlayerRef.current.position.copy(playerPos.current);

            // 🎯 ROTATION LOGIC: Face movement direction when walking
            if (isMoving) {
                const movementAngle = Math.atan2(moveVector.x, moveVector.z);
                localPlayerRef.current.rotation.y = lerpAngle(
                    localPlayerRef.current.rotation.y,
                    movementAngle,
                    Math.min(delta * 12, 0.4) // Steady but smooth turning
                );
            } else if (cameraMode === 'first') {
                // In first person, always align with camera
                const targetRotation = camera.rotation.y + CHARACTER_ROTATION_OFFSET;
                localPlayerRef.current.rotation.y = lerpAngle(localPlayerRef.current.rotation.y, targetRotation, 1.0);
            }
        }

        if (cameraMode === 'third') {
            const eyeHeight = 1.6;
            const cameraOffset = forward.clone().multiplyScalar(-cameraDistance.current);
            const targetPos = playerPos.current.clone().add(cameraOffset).add(new THREE.Vector3(0, eyeHeight, 0));
            if (!isNaN(targetPos.x)) camera.position.lerp(targetPos, CAMERA_SMOOTHING);
        } else {
            camera.position.copy(playerPos.current).add(new THREE.Vector3(0, 1.7, 0));
        }

        const now = Date.now();
        if (now - lastBroadcast.current > VR_SAFETY_LIMITS.POSITION_SYNC_INTERVAL) {
            lastBroadcast.current = now;
            if (useColyseusMultiplayer && multiplayer.isConnected && localPlayerRef.current) {
                // Send the actual avatar rotation minus the offset (so remote side can add it back)
                const syncRotation = localPlayerRef.current.rotation.y - CHARACTER_ROTATION_OFFSET;
                multiplayer.sendPosition(playerPos.current.x, playerPos.current.y, playerPos.current.z, syncRotation, isMoving);
            }
        }
    });

    const handleFloorClick = async (e: any) => { e.stopPropagation(); };

    const playersToRender = useColyseusMultiplayer
        ? multiplayer.otherPlayers.map(p => ({
            id: p.id,
            name: p.name,
            color: primaryColor,
            position: [p.x, p.y, p.z] as [number, number, number], // No more offset
            rotation: p.ry + CHARACTER_ROTATION_OFFSET,
            avatarUrl: p.avatarUrl || DEFAULT_AVATARS[p.avatarKey || 'default'] || DEFAULT_AVATARS['a1'],
            emote: p.isMoving ? 'walk' : (multiplayer.activeEmotes.get(p.id) || 'idle')
        }))
        : otherPlayers;

    const [envLoaded, setEnvLoaded] = useState(false);

    return (
        <group>
            {/* 🏙️ FLOOR & GRID */}
            {!isFullGlbMode && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onClick={handleFloorClick}>
                        <planeGeometry args={[1000, 1000]} />
                        {enableReflections ? (
                            <MeshReflectorMaterial
                                blur={[300, 100]}
                                resolution={1024}
                                mixBlur={1}
                                mixStrength={40}
                                roughness={1}
                                depthScale={1.2}
                                minDepthThreshold={0.4}
                                maxDepthThreshold={1.4}
                                color="#101010"
                                metalness={0.5}
                                mirror={0.5}
                            />
                        ) : (
                            <meshStandardMaterial color="#050508" metalness={0.9} roughness={0.15} envMapIntensity={0.5} />
                        )}
                    </mesh>
                    <gridHelper args={[400, 80, '#1e293b', '#0f172a']} position={[0, 0.01, 0]} />
                </>
            )}

            {/* 🪞 CUSTOM ENVIRONMENT REFLECTION OVERLAY */}
            {isFullGlbMode && enableReflections && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <MeshReflectorMaterial
                        blur={[300, 100]}
                        resolution={1024}
                        mixBlur={1}
                        mixStrength={10}
                        roughness={1}
                        depthScale={1.2}
                        minDepthThreshold={0.4}
                        maxDepthThreshold={1.4}
                        color="#000000"
                        metalness={0.1}
                        mirror={0.5}
                        transparent={true}
                        opacity={0.3} // Subtle polish over the custom texture
                    />
                </mesh>
            )}

            {/* 🛋️ FURNITURE & LAYOUTS */}
            {templateId === 'template_boardroom' && <BoardroomFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
            {templateId === 'template_studio' && <StudioFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
            {templateId === 'template_zen' && <ZenFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
            {templateId === 'template_expo' && <ExpoFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
            {templateId === 'template_whiteboard' && <WhiteboardFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
            {templateId === 'template_showroom' && <ShowroomFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
            {templateId === 'template_command' && <CommandCenterFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}

            {/* 🧍 MULTIPLAYER AVATARS */}
            {
                playersToRender.map((p: any) => (
                    <Suspense key={p.id} fallback={null}>
                        <group name={`remote-root-${p.id}`}>
                            <group position={[0, 0, 0]}>
                                <RPMAvatar
                                    sessionId={p.id} name={p.name} avatarUrl={p.avatarUrl}
                                    position={p.position} rotation={p.rotation}
                                    currentEmote={p.emote} chatMessage={chatBubbles.get(p.id)} color={p.color} isSelf={false}
                                />
                            </group>
                        </group>
                    </Suspense>
                ))
            }

            {/* 🧍 LOBBY AVATARS */}
            {!hasEntered && (
                <group position={[0, 0, 0]}>
                    {[-2, 0, 2].map((x, i) => (
                        <group key={x} position={[x, 0, 0]}>
                            <mesh position={[0, 0.9, 0]} onClick={() => onSelectAvatar?.(['a1', 'a2', 'a3'][i])}>
                                <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
                                <meshStandardMaterial color={primaryColor} transparent opacity={0.3} />
                            </mesh>
                            <Text position={[0, 2.1, 0]} fontSize={0.1} color="white">{['Executive', 'Architect', 'Creative'][i]}</Text>
                        </group>
                    ))}
                </group>
            )}

            {/* 🧍 LOCAL PLAYER */}
            {user && (
                <group ref={localPlayerRef} visible={cameraMode === 'third'} renderOrder={999}>
                    {localAvatarScene ? (
                        <primitive object={localAvatarScene} scale={1} position={[0, 0, 0]} castShadow receiveShadow />
                    ) : (
                        <mesh position={[0, 0.9, 0]}>
                            <capsuleGeometry args={[0.4, 1, 4, 8]} />
                            <meshStandardMaterial color={primaryColor} transparent opacity={0.5} />
                        </mesh>
                    )}
                    <NameTag
                        name={`${user.name} (You)`}
                        color={primaryColor}
                        position={[0, 2.2, 0]}
                    />
                </group>
            )}

            {/* 🏗️ CUSTOM GLB MODELS */}
            {customGlbUrl && isValidModelUrl(customGlbUrl) && (
                <Suspense fallback={null}>
                    <Gltf
                        src={customGlbUrl}
                        position={(space as any)?.envOffset || [0, 0, 0]}
                        onLoad={(gltf) => {
                            gltf.scene.traverse(c => {
                                if ((c as THREE.Mesh).isMesh) {
                                    c.castShadow = false;
                                    c.receiveShadow = true;
                                }
                            });
                            setEnvLoaded(true);
                        }}
                        receiveShadow={true}
                        castShadow={false}
                    />
                </Suspense>
            )}

            {/* 🧱 COLLIDER MESH */}
            <group ref={colliderMeshRef}>
                {colliderGlbUrl && isValidModelUrl(colliderGlbUrl) ? (
                    <Suspense fallback={null}>
                        <Gltf src={colliderGlbUrl} position={(space as any)?.envOffset || [0, 0, 0]} visible={false} receiveShadow={false} castShadow={false} />
                    </Suspense>
                ) : customGlbUrl && isValidModelUrl(customGlbUrl) && (
                    <Suspense fallback={null}>
                        <Gltf
                            src={customGlbUrl.replace(/\.glb$/i, '_collider.glb')}
                            position={(space as any)?.envOffset || [0, 0, 0]}
                            visible={false}
                            receiveShadow={false}
                            castShadow={false}
                            onError={() => console.log('No implicit collider found for scene.')}
                        />
                    </Suspense>
                )}
            </group>

            {/* 📦 UPLOADED ASSET MODELS */}
            {assets && assets.filter(a => (a.type === 'model' || /\.(glb|gltf)$/i.test(a.name)) && a.url).map((asset, index) => (
                <Suspense key={asset.id || index} fallback={null}>
                    <Gltf
                        src={asset.url}
                        position={[index * 3, 0, 0]}
                        castShadow={false}
                        receiveShadow={true}
                        onLoad={(gltf) => {
                            gltf.scene.traverse(c => {
                                if ((c as THREE.Mesh).isMesh) {
                                    c.castShadow = false;
                                    c.receiveShadow = true;
                                }
                            });
                        }}
                    />
                </Suspense>
            ))}

            {/* 🏗️ SCENE OBJECTS FROM FIRESTORE */}
            {sceneObjects.filter(obj => obj.type === 'model' && obj.url && isValidModelUrl(obj.url)).map((obj) => (
                <Suspense key={obj.id} fallback={null}>
                    <Gltf
                        src={obj.url!}
                        position={[obj.pos?.x || 0, obj.pos?.y || 0, obj.pos?.z || 0]}
                        rotation={[(obj.rot?.x || 0) * Math.PI / 180, (obj.rot?.y || 0) * Math.PI / 180, (obj.rot?.z || 0) * Math.PI / 180]}
                        castShadow={false}
                        receiveShadow={true}
                        onLoad={(gltf) => {
                            gltf.scene.traverse(c => {
                                if ((c as THREE.Mesh).isMesh) {
                                    c.castShadow = false;
                                    c.receiveShadow = true;
                                }
                            });
                        }}
                    />
                </Suspense>
            ))}

            {/* 🖥️ SMART SCREENS */}
            {hasEntered && (
                <>
                    {(space as any)?.screenConfig?.workspace !== null && (
                        <SmartScreen
                            position={(space as any)?.screenConfig?.workspace?.position || [0, 3.5, -8]}
                            rotation={((r) => r ? [Math.abs(r[0]) > 6.3 ? r[0] * Math.PI / 180 : r[0], Math.abs(r[1]) > 6.3 ? r[1] * Math.PI / 180 : r[1], Math.abs(r[2]) > 6.3 ? r[2] * Math.PI / 180 : r[2]] : [0, 0, 0])((space as any)?.screenConfig?.workspace?.rotation)}
                            size={(space as any)?.screenConfig?.workspace?.size || [6, 3.5]}
                            mode={AppMode.DOCS} accentColor={primaryColor} title="WORKSPACE" contentUrl=""
                            modelName={user?.labsTool}
                        />
                    )}
                    {(space as any)?.screenConfig?.calendar !== null && (
                        <SmartScreen
                            position={(space as any)?.screenConfig?.calendar?.position || [-10, 3, 0]}
                            rotation={(space as any)?.screenConfig?.calendar?.rotation || [0, Math.PI / 2, 0]}
                            size={(space as any)?.screenConfig?.calendar?.size || [4, 2.5]}
                            mode={AppMode.CALENDAR} accentColor={primaryColor} title="CALENDAR"
                            modelName={user?.labsTool}
                        />
                    )}
                    {(space as any)?.screenConfig?.notes !== null && (
                        <SmartScreen
                            position={(space as any)?.screenConfig?.notes?.position || [10, 3, 0]}
                            rotation={(space as any)?.screenConfig?.notes?.rotation || [0, -Math.PI / 2, 0]}
                            size={(space as any)?.screenConfig?.notes?.size || [4, 2.5]}
                            mode={AppMode.DASHBOARD} accentColor={primaryColor} title="NOTES"
                            modelName={user?.labsTool}
                        />
                    )}
                </>
            )}

            {/* 🖥️ 3D SHARED SCREEN PLANE */}
            {screenState && screenState.active && (
                <Suspense fallback={null}>
                    <ScreenPlane
                        screenState={screenState}
                        isPresenter={colyseusService.getSessionId() === screenState.presenterId}
                        stream={screenStream}
                    />
                </Suspense>
            )}

            {/* 🎨 CANVAS */}
            {spaceId && <InfiniteCanvas
                spaceId={spaceId}
                userId={user?.id || myId.current}
                userName={user?.name || 'Guest'}
                activeTool={activeTool}
                toolColor={toolPayload}
                hideFloor
                hideUI
                isVRMode={false}
                user={user}
                onUpdateUser={onUpdateUser}
            />}
        </group >
    );
};

export default Room;