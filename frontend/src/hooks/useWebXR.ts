/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎮 WEBXR CONTROLS HOOK
 * React hook for WebXR integration with Three.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { webXRManager, XRState, XRControllerState } from '../services/WebXRManager';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseWebXRResult {
    isSupported: boolean;
    isActive: boolean;
    controllers: XRControllerState[];
    enterVR: () => Promise<boolean>;
    exitVR: () => Promise<void>;
    state: XRState;
}

export interface UseWebXROptions {
    onEnterVR?: () => void;
    onExitVR?: () => void;
    onSelectStart?: (hand: 'left' | 'right', position: THREE.Vector3) => void;
    onSelectEnd?: (hand: 'left' | 'right') => void;
    onSqueeze?: (hand: 'left' | 'right') => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useWebXR(options: UseWebXROptions = {}): UseWebXRResult {
    const { gl, scene } = useThree();
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [controllers, setControllers] = useState<XRControllerState[]>([]);
    const [state, setState] = useState<XRState>(webXRManager.getState());

    const controllerGroupsRef = useRef<THREE.Group[]>([]);
    const teleportRaysRef = useRef<THREE.Line[]>([]);

    // Initialize WebXR
    useEffect(() => {
        const init = async () => {
            // Initialize manager with renderer
            webXRManager.initialize(gl);

            // Check support
            const supported = await webXRManager.checkSupport();
            setIsSupported(supported);

            // Setup callbacks
            webXRManager.setCallbacks({
                onSessionStart: () => {
                    setIsActive(true);
                    setState(webXRManager.getState());
                    options.onEnterVR?.();
                },
                onSessionEnd: () => {
                    setIsActive(false);
                    setState(webXRManager.getState());
                    options.onExitVR?.();

                    // Remove controller visuals
                    controllerGroupsRef.current.forEach(group => {
                        scene.remove(group);
                    });
                    controllerGroupsRef.current = [];
                },
                onControllerConnected: (controller) => {
                    setControllers(prev => [...prev, controller]);

                    // Add controller to scene
                    const index = controller.hand === 'left' ? 1 : 0;
                    const controllerGroup = webXRManager.getController(index as 0 | 1);

                    if (controllerGroup) {
                        // Add visual model
                        const model = webXRManager.createControllerModel(controller.hand);
                        controllerGroup.add(model);

                        // Add teleport ray
                        const ray = webXRManager.createTeleportRay();
                        ray.visible = false;
                        controllerGroup.add(ray);
                        teleportRaysRef.current[index] = ray;

                        scene.add(controllerGroup);
                        controllerGroupsRef.current.push(controllerGroup);
                    }
                },
                onControllerDisconnected: (hand) => {
                    setControllers(prev => prev.filter(c => c.hand !== hand));
                },
                onSelectStart: options.onSelectStart,
                onSelectEnd: options.onSelectEnd,
                onSqueeze: options.onSqueeze
            });
        };

        init();

        return () => {
            // Cleanup
            controllerGroupsRef.current.forEach(group => {
                scene.remove(group);
            });
        };
    }, [gl, scene, options]);

    // Enter VR mode
    const enterVR = useCallback(async (): Promise<boolean> => {
        return await webXRManager.startVRSession();
    }, []);

    // Exit VR mode
    const exitVR = useCallback(async () => {
        await webXRManager.endSession();
    }, []);

    // Update state periodically
    useFrame(() => {
        if (isActive) {
            setState(webXRManager.getState());
        }
    });

    return {
        isSupported,
        isActive,
        controllers,
        enterVR,
        exitVR,
        state
    };
}

export default useWebXR;
