/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎤 VOICE CHAT SERVICE
 * Enterprise-grade WebRTC voice chat for GreenGalaxy VR
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VoicePeer {
    id: string;
    name: string;
    connection: RTCPeerConnection;
    audioStream?: MediaStream;
    isMuted: boolean;
    isSpeaking: boolean;
    volume: number;
}

export interface VoiceState {
    isEnabled: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    peers: Map<string, VoicePeer>;
    localStream: MediaStream | null;
}

export interface VoiceChatCallbacks {
    onPeerJoined?: (peerId: string, name: string) => void;
    onPeerLeft?: (peerId: string) => void;
    onPeerSpeaking?: (peerId: string, isSpeaking: boolean) => void;
    onError?: (error: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 ICE SERVERS (STUN/TURN)
// ═══════════════════════════════════════════════════════════════════════════════

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN servers for production (needed for NAT traversal)
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎤 VOICE CHAT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class VoiceChatService {
    private localStream: MediaStream | null = null;
    private peers: Map<string, VoicePeer> = new Map();
    private audioContext: AudioContext | null = null;
    private analyserNodes: Map<string, AnalyserNode> = new Map();
    private callbacks: VoiceChatCallbacks = {};

    // State
    private isEnabled = false;
    private isMuted = false;
    private isDeafened = false;

    // Signaling (we'll use Colyseus for this)
    private signalHandler: ((type: string, peerId: string, data: any) => void) | null = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎤 MICROPHONE CONTROL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Initialize voice chat and get microphone access
     */
    async enable(): Promise<boolean> {
        try {
            console.log('🎤 Requesting microphone access...');

            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                },
                video: false
            });

            // Create audio context for voice activity detection
            this.audioContext = new AudioContext();

            this.isEnabled = true;
            console.log('✅ Microphone enabled');

            return true;
        } catch (error) {
            console.error('❌ Failed to get microphone access:', error);
            this.callbacks.onError?.('Microphone access denied');
            return false;
        }
    }

    /**
     * Disable voice chat and release microphone
     */
    disable(): void {
        // Stop all tracks
        this.localStream?.getTracks().forEach(track => track.stop());
        this.localStream = null;

        // Close all peer connections
        this.peers.forEach(peer => {
            peer.connection.close();
            peer.audioStream?.getTracks().forEach(t => t.stop());
        });
        this.peers.clear();

        // Close audio context
        this.audioContext?.close();
        this.audioContext = null;
        this.analyserNodes.clear();

        this.isEnabled = false;
        console.log('🔇 Voice chat disabled');
    }

    /**
     * Toggle mute
     */
    toggleMute(): boolean {
        this.isMuted = !this.isMuted;

        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !this.isMuted;
            });
        }

        console.log(this.isMuted ? '🔇 Muted' : '🔊 Unmuted');
        return this.isMuted;
    }

    /**
     * Toggle deafen (mute incoming audio)
     */
    toggleDeafen(): boolean {
        this.isDeafened = !this.isDeafened;

        this.peers.forEach(peer => {
            if (peer.audioStream) {
                peer.audioStream.getAudioTracks().forEach(track => {
                    track.enabled = !this.isDeafened;
                });
            }
        });

        console.log(this.isDeafened ? '🔇 Deafened' : '👂 Listening');
        return this.isDeafened;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📞 PEER CONNECTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a new peer connection and initiate call
     */
    async connectToPeer(peerId: string, peerName: string): Promise<void> {
        if (this.peers.has(peerId)) {
            console.log('Already connected to peer:', peerId);
            return;
        }

        console.log('📞 Connecting to peer:', peerId, peerName);

        const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        const peer: VoicePeer = {
            id: peerId,
            name: peerName,
            connection,
            isMuted: false,
            isSpeaking: false,
            volume: 1.0
        };

        // Add local stream tracks to connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                connection.addTrack(track, this.localStream!);
            });
        }

        // Handle incoming audio tracks
        connection.ontrack = (event) => {
            console.log('🎧 Received audio from:', peerName);
            peer.audioStream = event.streams[0];

            // Create audio element to play remote audio
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
            audio.volume = peer.volume;

            // Setup voice activity detection
            this.setupVoiceActivityDetection(peerId, event.streams[0]);

            this.callbacks.onPeerJoined?.(peerId, peerName);
        };

        // ICE candidate handling
        connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalHandler?.('ice-candidate', peerId, event.candidate);
            }
        };

        // Connection state monitoring
        connection.onconnectionstatechange = () => {
            console.log(`📡 Peer ${peerId} connection state:`, connection.connectionState);

            if (connection.connectionState === 'disconnected' ||
                connection.connectionState === 'failed') {
                this.disconnectFromPeer(peerId);
            }
        };

        this.peers.set(peerId, peer);

        // Create and send offer
        try {
            const offer = await connection.createOffer();
            await connection.setLocalDescription(offer);
            this.signalHandler?.('offer', peerId, offer);
        } catch (error) {
            console.error('Failed to create offer:', error);
        }
    }

    /**
     * Handle incoming offer from peer
     */
    async handleOffer(peerId: string, peerName: string, offer: RTCSessionDescriptionInit): Promise<void> {
        console.log('📞 Received offer from:', peerId);

        const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        const peer: VoicePeer = {
            id: peerId,
            name: peerName,
            connection,
            isMuted: false,
            isSpeaking: false,
            volume: 1.0
        };

        // Add local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                connection.addTrack(track, this.localStream!);
            });
        }

        // Handle incoming audio
        connection.ontrack = (event) => {
            console.log('🎧 Received audio from:', peerName);
            peer.audioStream = event.streams[0];

            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.autoplay = true;

            this.setupVoiceActivityDetection(peerId, event.streams[0]);
            this.callbacks.onPeerJoined?.(peerId, peerName);
        };

        connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalHandler?.('ice-candidate', peerId, event.candidate);
            }
        };

        connection.onconnectionstatechange = () => {
            if (connection.connectionState === 'disconnected' ||
                connection.connectionState === 'failed') {
                this.disconnectFromPeer(peerId);
            }
        };

        this.peers.set(peerId, peer);

        // Set remote description and create answer
        await connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);

        this.signalHandler?.('answer', peerId, answer);
    }

    /**
     * Handle incoming answer from peer
     */
    async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        const peer = this.peers.get(peerId);
        if (!peer) return;

        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Connection established with:', peerId);
    }

    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const peer = this.peers.get(peerId);
        if (!peer) return;

        try {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
        }
    }

    /**
     * Disconnect from a specific peer
     */
    disconnectFromPeer(peerId: string): void {
        const peer = this.peers.get(peerId);
        if (!peer) return;

        peer.connection.close();
        peer.audioStream?.getTracks().forEach(t => t.stop());
        this.peers.delete(peerId);
        this.analyserNodes.delete(peerId);

        this.callbacks.onPeerLeft?.(peerId);
        console.log('👋 Disconnected from peer:', peerId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔊 VOICE ACTIVITY DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    private setupVoiceActivityDetection(peerId: string, stream: MediaStream): void {
        if (!this.audioContext) return;

        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        this.analyserNodes.set(peerId, analyser);

        // Monitor voice activity
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVoiceActivity = () => {
            const peer = this.peers.get(peerId);
            if (!peer) return;

            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

            const isSpeaking = average > 20; // Threshold
            if (peer.isSpeaking !== isSpeaking) {
                peer.isSpeaking = isSpeaking;
                this.callbacks.onPeerSpeaking?.(peerId, isSpeaking);
            }

            if (this.peers.has(peerId)) {
                requestAnimationFrame(checkVoiceActivity);
            }
        };

        checkVoiceActivity();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📡 SIGNALING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Set the signal handler (called when we need to send signaling data via Colyseus)
     */
    setSignalHandler(handler: (type: string, peerId: string, data: any) => void): void {
        this.signalHandler = handler;
    }

    /**
     * Set event callbacks
     */
    setCallbacks(callbacks: VoiceChatCallbacks): void {
        this.callbacks = callbacks;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    getState(): VoiceState {
        return {
            isEnabled: this.isEnabled,
            isMuted: this.isMuted,
            isDeafened: this.isDeafened,
            peers: this.peers,
            localStream: this.localStream
        };
    }

    getPeers(): VoicePeer[] {
        return Array.from(this.peers.values());
    }

    isVoiceEnabled(): boolean {
        return this.isEnabled;
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }
}

// Export singleton
export const voiceChatService = new VoiceChatService();
export default voiceChatService;
