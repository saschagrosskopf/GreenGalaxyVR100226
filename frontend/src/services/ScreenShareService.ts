/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🖥️ SCREEN SHARING SERVICE
 * Enterprise-grade WebRTC screen sharing for GreenGalaxy VR
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScreenShareState {
    isSharing: boolean;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    currentPresenter: string | null;
}

export interface ScreenShareCallbacks {
    onStartSharing?: (stream: MediaStream) => void;
    onStopSharing?: () => void;
    onRemoteShare?: (peerId: string, stream: MediaStream) => void;
    onRemoteShareEnd?: (peerId: string) => void;
    onError?: (error: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 ICE SERVERS
// ═══════════════════════════════════════════════════════════════════════════════

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🖥️ SCREEN SHARE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ScreenShareService {
    private localStream: MediaStream | null = null;
    private remoteStreams: Map<string, MediaStream> = new Map();
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private listeners: Set<ScreenShareCallbacks> = new Set();
    private signalHandler: ((type: string, peerId: string, data: any) => void) | null = null;

    private isSharing = false;
    private currentPresenter: string | null = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // 🖥️ LOCAL SCREEN SHARING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Start sharing screen
     */
    async startSharing(): Promise<MediaStream | null> {
        try {
            console.log('🖥️ Starting screen share...');

            // Request screen capture
            // Cast to any because TypeScript's MediaTrackConstraints doesn't include all getDisplayMedia options
            this.localStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                } as any,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Handle stream end (user clicks "Stop sharing")
            this.localStream.getVideoTracks()[0].onended = () => {
                this.stopSharing();
            };

            this.isSharing = true;
            this.notifyListeners('onStartSharing', this.localStream);

            console.log('✅ Screen sharing started');
            return this.localStream;
        } catch (error: any) {
            console.error('❌ Screen share failed:', error);

            if (error.name === 'NotAllowedError') {
                this.notifyListeners('onError', 'Screen sharing permission denied');
            } else {
                this.notifyListeners('onError', 'Failed to start screen sharing');
            }

            return null;
        }
    }

    /**
     * Stop sharing screen
     */
    stopSharing(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close all peer connections for sharing
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();

        this.isSharing = false;
        this.notifyListeners('onStopSharing');

        console.log('🛑 Screen sharing stopped');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 PEER CONNECTION FOR SCREEN SHARING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Share screen to a specific peer
     */
    async shareToViewer(viewerId: string): Promise<void> {
        if (!this.localStream) {
            console.error('No local stream to share');
            return;
        }

        console.log('📤 Sharing screen to viewer:', viewerId);

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.peerConnections.set(viewerId, pc);

        // Add screen stream tracks
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream!);
        });

        // ICE candidate handling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalHandler?.('screen-ice', viewerId, event.candidate);
            }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.signalHandler?.('screen-offer', viewerId, offer);
    }

    /**
     * Handle incoming screen share offer (as viewer)
     */
    async handleScreenOffer(presenterId: string, offer: RTCSessionDescriptionInit): Promise<void> {
        console.log('📺 Receiving screen share from:', presenterId);

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.peerConnections.set(presenterId, pc);

        // Handle incoming video track
        pc.ontrack = (event) => {
            console.log('🖥️ Received screen stream from:', presenterId);
            this.remoteStreams.set(presenterId, event.streams[0]);
            this.currentPresenter = presenterId;
            this.notifyListeners('onRemoteShare', presenterId, event.streams[0]);
        };

        // ICE handling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalHandler?.('screen-ice', presenterId, event.candidate);
            }
        };

        // Connection state
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.handleRemoteShareEnd(presenterId);
            }
        };

        // Set remote description and create answer
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.signalHandler?.('screen-answer', presenterId, answer);
    }

    /**
     * Handle screen share answer
     */
    async handleScreenAnswer(viewerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        const pc = this.peerConnections.get(viewerId);
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Screen share connection established with:', viewerId);
    }

    /**
     * Handle screen share ICE candidate
     */
    async handleScreenIce(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const pc = this.peerConnections.get(peerId);
        if (!pc) return;

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Failed to add screen share ICE candidate:', error);
        }
    }

    /**
     * Handle remote share ending
     */
    handleRemoteShareEnd(presenterId: string): void {
        const stream = this.remoteStreams.get(presenterId);
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            this.remoteStreams.delete(presenterId);
        }

        const pc = this.peerConnections.get(presenterId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(presenterId);
        }

        if (this.currentPresenter === presenterId) {
            this.currentPresenter = null;
        }

        this.notifyListeners('onRemoteShareEnd', presenterId);
        console.log('📺 Remote share ended from:', presenterId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎬 VIDEO TEXTURE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a video element from stream (for use with Three.js VideoTexture)
     */
    createVideoElement(stream: MediaStream): HTMLVideoElement {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true; // Mute to avoid echo
        video.playsInline = true;

        // Ensure video starts playing
        video.play().catch(console.error);

        return video;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 SIGNALING
    // ═══════════════════════════════════════════════════════════════════════════

    setSignalHandler(handler: (type: string, peerId: string, data: any) => void): void {
        this.signalHandler = handler;
    }

    removeListener(callbacks: ScreenShareCallbacks): void {
        this.listeners.delete(callbacks);
    }

    // LEGACY: Keep for compatibility but use addListener
    setCallbacks(callbacks: ScreenShareCallbacks): void {
        this.listeners.add(callbacks);
    }

    private notifyListeners<K extends keyof ScreenShareCallbacks>(
        event: K,
        ...args: Parameters<NonNullable<ScreenShareCallbacks[K]>>
    ): void {
        this.listeners.forEach(l => {
            const cb = l[event];
            if (typeof cb === 'function') {
                (cb as any)(...args);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    getState(): ScreenShareState {
        return {
            isSharing: this.isSharing,
            localStream: this.localStream,
            remoteStreams: this.remoteStreams,
            currentPresenter: this.currentPresenter
        };
    }

    isScreenSharing(): boolean {
        return this.isSharing;
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(presenterId: string): MediaStream | undefined {
        return this.remoteStreams.get(presenterId);
    }

    getCurrentPresenter(): string | null {
        return this.currentPresenter;
    }
}

// Export singleton
export const screenShareService = new ScreenShareService();
export default screenShareService;
