/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🥽 WEBXR MANAGER
 * Enterprise-grade VR headset support for GreenGalaxy
 * Supports Meta Quest, HTC Vive, Valve Index, and Windows Mixed Reality
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface XRState {
    isSupported: boolean;
    isSessionActive: boolean;
    sessionType: 'immersive-vr' | 'immersive-ar' | 'inline' | null;
    referenceSpace: XRReferenceSpace | null;
    inputSources: XRInputSource[];
    headsetType: string | null;
}

export interface XRControllerState {
    hand: 'left' | 'right';
    position: THREE.Vector3;
    rotation: THREE.Quaternion;
    buttons: XRButtonState[];
    axes: number[];
    isConnected: boolean;
}

export interface XRButtonState {
    pressed: boolean;
    touched: boolean;
    value: number;
}

export interface XRCallbacks {
    onSessionStart?: () => void;
    onSessionEnd?: () => void;
    onControllerConnected?: (controller: XRControllerState) => void;
    onControllerDisconnected?: (hand: 'left' | 'right') => void;
    onSelectStart?: (hand: 'left' | 'right', position: THREE.Vector3) => void;
    onSelectEnd?: (hand: 'left' | 'right') => void;
    onSqueeze?: (hand: 'left' | 'right') => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🥽 WEBXR MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class WebXRManager {
    private renderer: THREE.WebGLRenderer | null = null;
    private session: XRSession | null = null;
    private referenceSpace: XRReferenceSpace | null = null;
    private callbacks: XRCallbacks = {};

    // Controller tracking
    private controllers: Map<number, XRControllerState> = new Map();
    private controllerGrips: Map<number, THREE.Group> = new Map();

    // State
    private isSupported = false;
    private isSessionActive = false;
    private sessionType: 'immersive-vr' | 'immersive-ar' | 'inline' | null = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔍 FEATURE DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Check if WebXR is supported
     */
    async checkSupport(): Promise<boolean> {
        if (!navigator.xr) {
            console.log('❌ WebXR not available in this browser');
            this.isSupported = false;
            return false;
        }

        try {
            // Check for VR support
            const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
            this.isSupported = isVRSupported;

            if (isVRSupported) {
                console.log('✅ WebXR VR supported!');
            } else {
                console.log('⚠️ WebXR available but VR not supported');
            }

            return isVRSupported;
        } catch (error) {
            console.error('Error checking WebXR support:', error);
            this.isSupported = false;
            return false;
        }
    }

    /**
     * Check for AR support
     */
    async checkARSupport(): Promise<boolean> {
        if (!navigator.xr) return false;

        try {
            return await navigator.xr.isSessionSupported('immersive-ar');
        } catch {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎮 SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Initialize WebXR with Three.js renderer
     */
    initialize(renderer: THREE.WebGLRenderer): void {
        this.renderer = renderer;
        renderer.xr.enabled = true;

        console.log('🥽 WebXR Manager initialized');
    }

    /**
     * Start VR session
     */
    async startVRSession(): Promise<boolean> {
        if (!this.renderer || !navigator.xr) {
            console.error('WebXR not initialized or not supported');
            return false;
        }

        try {
            console.log('🥽 Starting VR session...');

            // Request immersive VR session
            this.session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: [
                    'local-floor',
                    'bounded-floor',
                    'hand-tracking',
                    'layers'
                ]
            });

            // Set up session
            await this.renderer.xr.setSession(this.session);

            // Get reference space
            this.referenceSpace = await this.session.requestReferenceSpace('local-floor');

            // Setup controllers
            this.setupControllers();

            // Handle session end
            this.session.addEventListener('end', () => {
                this.handleSessionEnd();
            });

            this.isSessionActive = true;
            this.sessionType = 'immersive-vr';
            this.callbacks.onSessionStart?.();

            console.log('✅ VR session started!');
            return true;
        } catch (error) {
            console.error('❌ Failed to start VR session:', error);
            return false;
        }
    }

    /**
     * End current XR session
     */
    async endSession(): Promise<void> {
        if (this.session) {
            await this.session.end();
        }
    }

    private handleSessionEnd(): void {
        console.log('🥽 VR session ended');

        this.session = null;
        this.referenceSpace = null;
        this.isSessionActive = false;
        this.sessionType = null;
        this.controllers.clear();

        this.callbacks.onSessionEnd?.();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎮 CONTROLLER HANDLING
    // ═══════════════════════════════════════════════════════════════════════════

    private setupControllers(): void {
        if (!this.renderer) return;

        // Controller 0 (usually right hand)
        const controller0 = this.renderer.xr.getController(0);
        this.setupController(controller0, 0);

        // Controller 1 (usually left hand)
        const controller1 = this.renderer.xr.getController(1);
        this.setupController(controller1, 1);

        // Controller grips (for rendering controller models)
        const grip0 = this.renderer.xr.getControllerGrip(0);
        const grip1 = this.renderer.xr.getControllerGrip(1);

        this.controllerGrips.set(0, grip0);
        this.controllerGrips.set(1, grip1);
    }

    private setupController(controller: THREE.Group, index: number): void {
        const hand: 'left' | 'right' = index === 1 ? 'left' : 'right';

        // Use 'as any' for XR-specific events that Three.js types don't expose
        (controller as any).addEventListener('connected', (event: any) => {
            console.log(`🎮 Controller ${hand} connected`);

            const inputSource: XRInputSource = event.data;
            const state: XRControllerState = {
                hand,
                position: new THREE.Vector3(),
                rotation: new THREE.Quaternion(),
                buttons: [],
                axes: [],
                isConnected: true
            };

            this.controllers.set(index, state);
            this.callbacks.onControllerConnected?.(state);
        });

        (controller as any).addEventListener('disconnected', () => {
            console.log(`🎮 Controller ${hand} disconnected`);
            this.controllers.delete(index);
            this.callbacks.onControllerDisconnected?.(hand);
        });

        // Select events (trigger press)
        (controller as any).addEventListener('selectstart', () => {
            const state = this.controllers.get(index);
            if (state) {
                controller.getWorldPosition(state.position);
                this.callbacks.onSelectStart?.(hand, state.position.clone());
            }
        });

        (controller as any).addEventListener('selectend', () => {
            this.callbacks.onSelectEnd?.(hand);
        });

        // Squeeze events (grip press)
        (controller as any).addEventListener('squeezestart', () => {
            this.callbacks.onSqueeze?.(hand);
        });
    }

    /**
     * Get controller for adding to scene
     */
    getController(index: 0 | 1): THREE.Group | null {
        return this.renderer?.xr.getController(index) || null;
    }

    /**
     * Get controller grip for adding controller models
     */
    getControllerGrip(index: 0 | 1): THREE.Group | null {
        return this.renderer?.xr.getControllerGrip(index) || null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 TELEPORTATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a teleport ray visualization
     */
    createTeleportRay(): THREE.Line {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -5)
        ]);

        const material = new THREE.LineBasicMaterial({
            color: 0x06b6d4,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });

        return new THREE.Line(geometry, material);
    }

    /**
     * Create teleport target marker
     */
    createTeleportTarget(): THREE.Mesh {
        const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 CONTROLLER MODELS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a simple controller model (fallback if no model available)
     */
    createControllerModel(hand: 'left' | 'right'): THREE.Group {
        const group = new THREE.Group();

        // Controller body
        const bodyGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.12, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: hand === 'left' ? 0x4f46e5 : 0x06b6d4,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = -Math.PI / 4;
        group.add(body);

        // Pointer tip
        const tipGeometry = new THREE.ConeGeometry(0.01, 0.03, 8);
        const tipMaterial = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.set(0, 0, -0.08);
        tip.rotation.x = -Math.PI / 2;
        group.add(tip);

        return group;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 CALLBACKS
    // ═══════════════════════════════════════════════════════════════════════════

    setCallbacks(callbacks: XRCallbacks): void {
        this.callbacks = callbacks;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    getState(): XRState {
        return {
            isSupported: this.isSupported,
            isSessionActive: this.isSessionActive,
            sessionType: this.sessionType,
            referenceSpace: this.referenceSpace,
            inputSources: this.session?.inputSources ? Array.from(this.session.inputSources) : [],
            headsetType: this.detectHeadsetType()
        };
    }

    isVRActive(): boolean {
        return this.isSessionActive && this.sessionType === 'immersive-vr';
    }

    getSession(): XRSession | null {
        return this.session;
    }

    getReferenceSpace(): XRReferenceSpace | null {
        return this.referenceSpace;
    }

    private detectHeadsetType(): string | null {
        // This is a best-effort detection based on user agent and features
        const ua = navigator.userAgent.toLowerCase();

        if (ua.includes('oculus') || ua.includes('quest')) return 'Meta Quest';
        if (ua.includes('vive')) return 'HTC Vive';
        if (ua.includes('index')) return 'Valve Index';
        if (ua.includes('wmr') || ua.includes('windows mixed reality')) return 'Windows MR';
        if (ua.includes('pico')) return 'Pico';

        return 'Unknown VR Headset';
    }
}

// Export singleton
export const webXRManager = new WebXRManager();
export default webXRManager;
