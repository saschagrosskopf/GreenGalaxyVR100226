/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔊 SPATIAL AUDIO SERVICE
 * Distance-based audio for immersive VR voice chat
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SpatialAudioConfig {
    maxDistance: number;      // Distance at which audio is silent (meters)
    refDistance: number;      // Distance at which volume starts to decrease
    rolloffFactor: number;    // How quickly volume decreases with distance
    innerAngle: number;       // Cone inner angle (degrees)
    outerAngle: number;       // Cone outer angle (degrees)
    outerGain: number;        // Volume outside the cone (0-1)
}

export interface AudioSource {
    id: string;
    audio: HTMLAudioElement;
    panner: PannerNode;
    gainNode: GainNode;
    position: THREE.Vector3;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔊 DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SpatialAudioConfig = {
    maxDistance: 30,          // 30 meters max hearing distance
    refDistance: 1,           // Full volume within 1 meter
    rolloffFactor: 1.5,       // Moderate rolloff
    innerAngle: 360,          // Omnidirectional by default
    outerAngle: 360,
    outerGain: 1
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔊 SPATIAL AUDIO SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class SpatialAudioService {
    private audioContext: AudioContext | null = null;
    private listener: AudioListener | null = null;
    private sources: Map<string, AudioSource> = new Map();
    private config: SpatialAudioConfig = DEFAULT_CONFIG;
    private isEnabled = false;

    // Listener (camera) position
    private listenerPosition = new THREE.Vector3();
    private listenerOrientation = new THREE.Quaternion();

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔌 INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Initialize the spatial audio system
     */
    async enable(): Promise<boolean> {
        try {
            this.audioContext = new AudioContext();

            // Resume if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isEnabled = true;
            console.log('🔊 Spatial audio enabled');
            return true;
        } catch (error) {
            console.error('❌ Failed to enable spatial audio:', error);
            return false;
        }
    }

    /**
     * Disable spatial audio
     */
    disable(): void {
        this.sources.forEach(source => {
            source.audio.pause();
            source.panner.disconnect();
            source.gainNode.disconnect();
        });
        this.sources.clear();

        this.audioContext?.close();
        this.audioContext = null;
        this.isEnabled = false;

        console.log('🔇 Spatial audio disabled');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎧 AUDIO SOURCE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Add a spatial audio source (e.g., for a player's voice)
     */
    addSource(id: string, stream: MediaStream, position: THREE.Vector3): void {
        if (!this.audioContext) return;

        // Create audio element
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.muted = false;

        // Create Web Audio nodes
        const source = this.audioContext.createMediaStreamSource(stream);
        const panner = this.audioContext.createPanner();
        const gainNode = this.audioContext.createGain();

        // Configure panner for 3D positioning
        panner.panningModel = 'HRTF';  // Head-Related Transfer Function for realistic 3D
        panner.distanceModel = 'inverse';
        panner.refDistance = this.config.refDistance;
        panner.maxDistance = this.config.maxDistance;
        panner.rolloffFactor = this.config.rolloffFactor;

        // Set cone (directional audio)
        panner.coneInnerAngle = this.config.innerAngle;
        panner.coneOuterAngle = this.config.outerAngle;
        panner.coneOuterGain = this.config.outerGain;

        // Set initial position
        panner.positionX.value = position.x;
        panner.positionY.value = position.y;
        panner.positionZ.value = position.z;

        // Connect nodes: source -> panner -> gain -> destination
        source.connect(panner);
        panner.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Store reference
        this.sources.set(id, {
            id,
            audio,
            panner,
            gainNode,
            position: position.clone()
        });

        console.log('🔊 Added spatial audio source:', id);
    }

    /**
     * Update source position (call when player moves)
     */
    updateSourcePosition(id: string, position: THREE.Vector3): void {
        const source = this.sources.get(id);
        if (!source) return;

        source.position.copy(position);
        source.panner.positionX.value = position.x;
        source.panner.positionY.value = position.y;
        source.panner.positionZ.value = position.z;
    }

    /**
     * Remove an audio source
     */
    removeSource(id: string): void {
        const source = this.sources.get(id);
        if (!source) return;

        source.audio.pause();
        source.panner.disconnect();
        source.gainNode.disconnect();
        this.sources.delete(id);

        console.log('🔇 Removed spatial audio source:', id);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 👂 LISTENER (CAMERA) POSITIONING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Update listener position (call every frame with camera position)
     */
    updateListener(position: THREE.Vector3, orientation: THREE.Quaternion): void {
        if (!this.audioContext) return;

        this.listenerPosition.copy(position);
        this.listenerOrientation.copy(orientation);

        const listener = this.audioContext.listener;

        // Update position
        if (listener.positionX) {
            listener.positionX.value = position.x;
            listener.positionY.value = position.y;
            listener.positionZ.value = position.z;
        }

        // Update orientation (forward and up vectors)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);

        if (listener.forwardX) {
            listener.forwardX.value = forward.x;
            listener.forwardY.value = forward.y;
            listener.forwardZ.value = forward.z;
            listener.upX.value = up.x;
            listener.upY.value = up.y;
            listener.upZ.value = up.z;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔧 VOLUME CONTROL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Set master volume for all sources
     */
    setMasterVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.sources.forEach(source => {
            source.gainNode.gain.value = clampedVolume;
        });
    }

    /**
     * Set individual source volume
     */
    setSourceVolume(id: string, volume: number): void {
        const source = this.sources.get(id);
        if (source) {
            source.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Mute/unmute a specific source
     */
    muteSource(id: string, muted: boolean): void {
        const source = this.sources.get(id);
        if (source) {
            source.gainNode.gain.value = muted ? 0 : 1;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📏 DISTANCE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get distance to a source
     */
    getDistanceToSource(id: string): number {
        const source = this.sources.get(id);
        if (!source) return Infinity;
        return this.listenerPosition.distanceTo(source.position);
    }

    /**
     * Get all sources sorted by distance
     */
    getSourcesByDistance(): { id: string; distance: number }[] {
        return Array.from(this.sources.values())
            .map(source => ({
                id: source.id,
                distance: this.listenerPosition.distanceTo(source.position)
            }))
            .sort((a, b) => a.distance - b.distance);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    isAudioEnabled(): boolean {
        return this.isEnabled;
    }

    getConfig(): SpatialAudioConfig {
        return { ...this.config };
    }

    setConfig(config: Partial<SpatialAudioConfig>): void {
        this.config = { ...this.config, ...config };

        // Update existing sources with new config
        this.sources.forEach(source => {
            source.panner.refDistance = this.config.refDistance;
            source.panner.maxDistance = this.config.maxDistance;
            source.panner.rolloffFactor = this.config.rolloffFactor;
        });
    }

    getSources(): string[] {
        return Array.from(this.sources.keys());
    }
}

// Export singleton
export const spatialAudioService = new SpatialAudioService();
export default spatialAudioService;
