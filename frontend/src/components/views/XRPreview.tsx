import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, XRButton, Controllers, Hands } from '@react-three/xr';
import * as THREE from 'three';
import { Stars, Environment, PerspectiveCamera, PointerLockControls, Gltf, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, N8AO, DepthOfField, ChromaticAberration, GodRays, SSAO } from '@react-three/postprocessing';
import { Room } from '../xr/Room';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { Space, User, RoomConfig, Asset } from '../../types';
import { getSessionId } from '../../logic';
import { api } from '../../services/api';
import PlayerList from '../xr/PlayerList';
import VRChat, { EmotesPanel } from '../xr/VRChat';
import MediaControls from '../xr/MediaControls';
import { TranscriptionService } from '../../services/TranscriptionService';
import { SerializationService } from '../../services/SerializationService';

// 🖼️ LOCAL ASSETS
import executiveImg from '../../assets/avatars/executive.png';
import architectImg from '../../assets/avatars/architect.png';
import creativeImg from '../../assets/avatars/creative.png';

interface Props {
  org: any;
  space: Space;
  user: User | null;
  onExit: () => void;
  onUpdateUser?: (updates: Partial<User>) => void;
}

const DEFAULT_AVATARS: Record<string, string> = {
  a1: '/assets/avatars/a1.glb',
  a2: '/assets/avatars/a2.glb',
  a3: '/assets/avatars/a3.glb'
};

const executiveAvatar = executiveImg;
const architectAvatar = architectImg;
const creativeAvatar = creativeImg;

const ToolButton: React.FC<{ icon: any, label: string, onClick: () => void, isActive?: boolean, variant?: 'primary' | 'secondary' }> = ({ icon, label, onClick, isActive, variant = 'secondary' }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group relative ${isActive
        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
        : variant === 'primary' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-[100000]">
        {label}
      </div>
    </button>
  );
};

const Icons = {
  select: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" />
    </svg>
  ),
  sticky: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M15 3v6h6" />
    </svg>
  ),
  shape: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
  text: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  connector: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M15 9l-6 6" />
    </svg>
  ),
  frame: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  sticker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  eraser: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 13L16 9L12 13L20 20Z" />
    </svg>
  ),
  vote: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M7 10v12" /><path d="M15 5.88l-2-2-5 5v13.1c0 .77.63 1.4 1.4 1.4H17c1.1 0 2-.9 2-2V13c0-1.1-.9-2-2-2h-3V5.88z" />
    </svg>
  ),
  model: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><polyline points="4.6 7 12 11.2 19.4 7" /><line x1="12" y1="11.2" x2="12" y2="21" />
    </svg>
  ),
  google: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 10h-2V7a4 4 0 0 0-8 0v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM9 7a3 3 0 0 1 6 0v3H9V7z" />
    </svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2L4.5 9l7.5 7 7.5-7L12 2z" /><path d="M4.5 15l7.5 7 7.5-7" />
    </svg>
  ),
  mic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  fx: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
};

const SceneLighting: React.FC<{ accentColor: string, castShadows?: boolean }> = ({ accentColor, castShadows = true }) => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow={castShadows} shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
    <pointLight position={[-10, 5, -10]} intensity={0.5} color={accentColor} />
    <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} castShadow={castShadows} />
  </>
);

// 🌌 SMART ENVIRONMENT LOADER
const SmartEnvironment: React.FC<{ url: string }> = ({ url }) => {
  const isHdr = url.toLowerCase().endsWith('.hdr') || url.toLowerCase().endsWith('.exr');
  if (isHdr) return <Environment files={url} background />;
  return <ImageSkybox url={url} />;
};

const ImageSkybox: React.FC<{ url: string }> = ({ url }) => {
  const texture = useTexture(url);
  useEffect(() => {
    if (texture) texture.mapping = THREE.EquirectangularReflectionMapping;
  }, [texture]);
  return <Environment map={texture} background />;
};

// 🛡️ ERROR BOUNDARY FOR 3D SCENE
class SceneErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.warn("Captured 3D Error:", error); }
  render() { if (this.state.hasError) return null; return this.props.children; }
}

const XRPreview: React.FC<Props> = ({ org, space, user, onExit, onUpdateUser }) => {
  const [config] = useState<RoomConfig>({
    wallColor: org?.primaryColor || '#06B6D4',
    logoUrl: org?.logoUrl,
    furnitureMap: org?.furnitureMap
  });

  const [hasEntered, setHasEntered] = useState(!!user?.avatarUrl);
  const [cameraMode, setCameraMode] = useState<'first' | 'third'>('third');
  const [activeTool, setActiveTool] = useState<any>('cursor');
  const [toolPayload, setToolPayload] = useState('');
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [showGemini, setShowGemini] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showAIAvatar, setShowAIAvatar] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [generatedAvatarPreview, setGeneratedAvatarPreview] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [showMediaControls, setShowMediaControls] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [transcriptionLog, setTranscriptionLog] = useState<any[]>([]);

  // Initialize Transcription Service
  useEffect(() => {
    const ts = TranscriptionService.getInstance();
    ts.setUpdateCallback((log) => setTranscriptionLog(log));
  }, []);

  // 🔄 AUTO-ENTRY FOR RETURNING USERS
  useEffect(() => {
    // If user profile loads with an avatar, skip the selection screen
    if (user?.avatarUrl && !hasEntered) {
      console.log('✅ Detected existing avatar, entering space automatically.');
      setHasEntered(true);
    }
  }, [user?.avatarUrl]);

  const handleCapture = async () => {
    if (!user || !space) return;
    setLoading(true);
    try {
      // Collect states (in a real app, these would come from refs in the Room component)
      const canvasObjects = (window as any).canvasObjects || [];
      const sceneObjects = (window as any).sceneObjects || [];

      const snapshot = await SerializationService.captureSnapshot(
        space,
        user,
        canvasObjects,
        sceneObjects,
        TranscriptionService.getInstance().getFullLog(),
        (window as any).dashboards || {}
      );

      const report = await api.sessions.getReport(snapshot.id);
      if (report) {
        const html = SerializationService.generateReportHTML(report, snapshot);
        // Create a blob and download it
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Session_Report_${snapshot.id}.html`;
        a.click();

        alert(`Snapshot ${snapshot.id} captured and report downloaded! Ready for deep context indexing.`);
      }
    } catch (e) {
      console.error(e);
      alert("Capture failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMockVoice = () => {
    if (user) {
      TranscriptionService.getInstance().mockConversation(user);
    }
  };


  // Post-processing effects state
  const [showPostProcessing, setShowPostProcessing] = useState(false);
  const [enableAO, setEnableAO] = useState(true);
  const [enableDOF, setEnableDOF] = useState(false);
  const [enableSSAO, setEnableSSAO] = useState(true);
  const [enableReflections, setEnableReflections] = useState(false);

  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (!hasEntered) return;
      if (e.key === 'Enter' && document.activeElement?.tagName !== 'INPUT') setShowChat(p => !p);
      if (e.key === 'c' || e.key === 'C') { if (document.activeElement?.tagName !== 'INPUT') setCameraMode(m => m === 'first' ? 'third' : 'first'); }
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [hasEntered]);

  // 📡 MULTIPLAYER HOOK
  const multiplayer = useMultiplayer(
    space?.id || 'default',
    user?.name || 'Guest',
    'a1',
    user?.avatarUrl || DEFAULT_AVATARS['a1'],
    space?.templateId === 'template_whiteboard' ? 'whitespace' : 'office'
  );

  const handleExit = async () => {
    try {
      console.log('🚪 handleExit: Starting exit sequence...');
      setIsExiting(true);

      const timeoutId = setTimeout(() => {
        console.warn('⚠️ handleExit: Cleanup timed out, forcing exit.');
        onExit?.();
      }, 2000);

      if (multiplayer) {
        console.log('🚪 handleExit: Disconnecting multiplayer...');
        await multiplayer.disconnect();
        console.log('🚪 handleExit: Multiplayer disconnected.');
      }

      const myId = getSessionId();
      if (myId) {
        console.log('🚪 handleExit: Removing user from API...');
        await api.multiplayer.removeUser(myId);
        console.log('🚪 handleExit: User removed from API.');
      }

      clearTimeout(timeoutId);
      console.log('🚪 handleExit: Cleanup complete, triggering onExit.');
      onExit?.();
    } catch (e) {
      console.error('❌ handleExit: Error during exit:', e);
      onExit?.();
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    // Persist to backend/Firestore (non-blocking with timeout)
    try {
      const updatePromise = api.team.updateProfile({ displayName: user?.name || 'Guest', avatarUrl: avatarId });
      // Race with 2s timeout so we don't hang UI
      await Promise.race([
        updatePromise,
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
      ]);
    } catch (e) {
      console.warn("Avatar update skipped/failed:", e);
    }

    // Update local session state
    if (onUpdateUser) {
      onUpdateUser({ avatarUrl: avatarId });
    }

    setHasEntered(true);
    setTimeout(() => {
      const canvas = document.querySelector('#xr-canvas canvas') as HTMLCanvasElement;
      if (canvas) canvas.requestPointerLock();
    }, 100);
  };

  const runAI = async () => {
    if (!aiPrompt || !space) return;
    setLoading(true);
    try {
      const layout = await api.ai.generateWorkshopLayout(aiPrompt);
      for (const obj of layout) await api.scenes.addSceneObject(space.id, obj);
      setShowGemini(false); setAiPrompt('');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const generateAIAvatar = async () => {
    if (!avatarPrompt) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setGeneratedAvatarPreview(`https://models.readyplayer.me/64bfa15f0e72c63d7c3934a1.png`);
    setLoading(false);
  };

  const useAIAvatar = () => {
    handleSelectAvatar('a1');
    setShowAIAvatar(false);
    setGeneratedAvatarPreview(null);
    setAvatarPrompt('');
  };

  useEffect(() => {
    if (hasEntered && !isExiting && !multiplayer.isConnected && !multiplayer.isConnecting && !multiplayer.error) {
      multiplayer.connect();
    }
  }, [hasEntered, isExiting, multiplayer]);

  if (!space) return null;

  const isCustomEnv = space?.templateId === 'custom' || space?.customAssets?.some(a => a.category === 'scene');

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 z-[100] overflow-hidden flex flex-col font-sans">

      {/* 👥 CONNECTION STATUS & PLAYER LIST */}
      {hasEntered && (
        <div className="fixed top-8 left-8 z-[10000] flex flex-col gap-2">
          <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border backdrop-blur-md ${multiplayer.isConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            multiplayer.error ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse'
            }`}>
            <div className={`w-2 h-2 rounded-full ${multiplayer.isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' :
              multiplayer.error ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
            <span>{multiplayer.isConnected ? `NEXUS LINK ACTIVE [${multiplayer.players.length} PLAYER(S)]` :
              multiplayer.error ? 'LINK CRITICAL' : 'ESTABLISHING LINK...'}</span>
          </div>

          <PlayerList
            players={multiplayer.players.map(p => ({
              id: p.id,
              name: p.name,
              isSpeaking: false,
              isVoiceActive: false
            }))}
            localPlayerId={multiplayer.localPlayerId}
            accentColor={config.wallColor}
          />
        </div>
      )}

      {/* 🎙️ HUD TRANSCRIPTION FEED */}
      {hasEntered && transcriptionLog.length > 0 && (
        <div className="fixed bottom-32 right-8 z-[10000] w-72 flex flex-col gap-2 pointer-events-none">
          {transcriptionLog.slice(-3).map((item, i) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl backdrop-blur-md border animate-in slide-in-from-right-full duration-500 ${item.isActionItem
                ? 'bg-cyan-500/20 border-cyan-500/40'
                : 'bg-slate-900/40 border-white/10'
                }`}
              style={{ opacity: 1 - (2 - i) * 0.3 }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{item.userName}</span>
                {item.isActionItem && <span className="text-[8px] bg-cyan-500 text-slate-950 px-1.5 rounded font-black italic">ACTION</span>}
              </div>
              <p className="text-xs text-white/90 leading-tight">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🏡 EXIT / DASHBOARD NAVIGATION */}
      {hasEntered && (
        <div className="fixed top-8 right-8 z-[10000]">
          <button
            onClick={handleExit}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white/80 hover:text-white hover:bg-slate-800/60 hover:border-white/20 transition-all group active:scale-95 shadow-2xl"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              {Icons.home}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 leading-none mb-1">Navigation</span>
              <span className="text-sm font-bold tracking-tight">BACK TO DASHBOARD</span>
            </div>
          </button>
        </div>
      )}

      {/* ✨ POST-PROCESSING EFFECTS PANEL */}
      {hasEntered && (
        <div className="fixed top-[120px] right-8 z-[10000]">
          <button
            onClick={() => setShowPostProcessing(!showPostProcessing)}
            className={`flex items-center gap-3 px-4 py-3 backdrop-blur-xl border rounded-2xl transition-all group active:scale-95 shadow-2xl ${showPostProcessing
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
              : 'bg-slate-900/40 border-white/10 text-white/80 hover:text-white hover:bg-slate-800/60 hover:border-white/20'
              }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${showPostProcessing
              ? 'bg-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              }`}>
              {Icons.fx}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80 leading-none mb-1">Visual FX</span>
              <span className="text-sm font-bold tracking-tight">POST-PROCESSING</span>
            </div>
          </button>

          {/* Effects Panel */}
          {showPostProcessing && (
            <div className="mt-3 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[280px]">
              <div className="space-y-3">
                {/* N8AO Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                      <span className="text-lg">🌑</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">Ambient Occlusion</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">N8AO</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAO}
                    onChange={(e) => setEnableAO(e.target.checked)}
                    className="w-5 h-5 rounded bg-white/10 border-2 border-white/20 checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all"
                  />
                </label>

                {/* Reflections Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                      <span className="text-lg">✨</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">Floor Reflections</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">PLANAR MIRROR</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableReflections}
                    onChange={(e) => setEnableReflections(e.target.checked)}
                    className="w-5 h-5 rounded bg-white/10 border-2 border-white/20 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer transition-all"
                  />
                </label>

                {/* Depth of Field Toggle */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                      <span className="text-lg">📷</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">Depth of Field</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">CAMERA FOCUS</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDOF}
                    onChange={(e) => setEnableDOF(e.target.checked)}
                    className="w-5 h-5 rounded bg-white/10 border-2 border-white/20 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer transition-all"
                  />
                </label>

                {/* SSAO Toggle (Restored) */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-all">
                      <span className="text-lg">🌓</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">Standard SSAO</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">OCCLUSION</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSSAO}
                    onChange={(e) => setEnableSSAO(e.target.checked)}
                    className="w-5 h-5 rounded bg-white/10 border-2 border-white/20 checked:bg-amber-500 checked:border-amber-500 cursor-pointer transition-all"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🚀 ENTRY PORTAL */}
      {!hasEntered && !isExiting && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-auto">
          <div className="max-w-4xl w-full px-10 text-center relative z-10">
            <h1 className="text-6xl font-black text-white mb-2 uppercase italic tracking-tighter">{space.name}</h1>
            <p className="text-cyan-400 text-sm font-bold tracking-[0.4em] uppercase mb-12">Choose your Identity to Enter</p>

            <div className="grid grid-cols-3 gap-6 mb-12">
              {[
                { id: 'a1', name: 'Executive', preview: executiveAvatar },
                { id: 'a2', name: 'Architect', preview: architectAvatar },
                { id: 'a3', name: 'Creative', preview: creativeAvatar }
              ].map(av => (
                <button
                  key={av.id}
                  onClick={() => handleSelectAvatar(av.id)}
                  className="bg-slate-900/80 border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 border-white/10 hover:border-cyan-500 shadow-xl group p-4"
                >
                  <div className="h-48 overflow-hidden bg-slate-800 rounded-xl mb-3">
                    <img src={av.preview} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={av.name} />
                  </div>
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">{av.name}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowAIAvatar(true)}
                className="px-8 py-4 bg-slate-900 border border-cyan-500/30 text-cyan-400 font-black rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-xs"
              >
                ✨ Create AI Avatar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚪 LEAVING OVERLAY */}
      {isExiting && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md pointer-events-auto">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Disconnecting...</h2>
          <p className="text-indigo-400 text-xs font-bold tracking-[0.4em] uppercase mt-2">Transitioning to Dashboard</p>
        </div>
      )}

      {/* 📋 NEXUS OS - TOOLBAR */}
      {hasEntered && (
        <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[10000] flex flex-col gap-6">
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2.5 flex flex-col gap-2.5 shadow-2xl">
            <ToolButton icon={Icons.select} label="Direct Selection" onClick={() => setActiveTool('cursor')} isActive={activeTool === 'cursor'} />
            <ToolButton icon={Icons.sticky} label="Rapid Insight" onClick={() => { setActiveTool('sticky'); setToolPayload('#fef3c7'); }} isActive={activeTool === 'sticky'} />
            <ToolButton icon={Icons.shape} label="Logical Block" onClick={() => setActiveTool('shape')} isActive={activeTool === 'shape'} />
            <ToolButton icon={Icons.text} label="Notation" onClick={() => setActiveTool('text')} isActive={activeTool === 'text'} />
          </div>

          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2.5 flex flex-col gap-2.5 shadow-2xl">
            <ToolButton icon={Icons.frame} label="Frame Layer" onClick={() => setActiveTool('frame')} isActive={activeTool === 'frame'} />
            <ToolButton icon={Icons.sticker} label="Sticker" onClick={() => setActiveTool('sticker')} isActive={activeTool === 'sticker'} />
            <ToolButton icon={Icons.eraser} label="Eraser" onClick={() => setActiveTool('eraser')} isActive={activeTool === 'eraser'} />
          </div>

          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2.5 flex flex-col gap-2.5 shadow-2xl">
            <ToolButton icon={Icons.vote} label="Consensus Voting" onClick={() => setActiveTool('vote')} isActive={activeTool === 'vote'} />
            <ToolButton icon={Icons.model} label="3D Object" onClick={() => setActiveTool('model')} isActive={activeTool === 'model'} />
          </div>

          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2.5 flex flex-col gap-2.5 shadow-2xl">
            <ToolButton icon={Icons.mic} label="Mock Voice Input" onClick={handleMockVoice} variant="primary" />
            <ToolButton icon={<span className="text-xl">📸</span>} label="Smart State Capture" onClick={handleCapture} variant="primary" />
            <ToolButton icon={Icons.google} label="Workspace Sync" onClick={() => setShowWorkspace(true)} variant="primary" />
            <ToolButton icon={Icons.ai} label="AI Spatial Generator" onClick={() => setShowGemini(true)} variant="primary" />
          </div>
        </div>
      )}

      {/* 📋 BOTTOM BAR */}
      {hasEntered && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000]">
          <div className="bg-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[40px] px-8 py-4 flex items-center gap-8 shadow-2xl">
            <div className="flex items-center gap-3 pr-8 border-r border-white/10">
              <button onClick={() => setShowChat(!showChat)} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${showChat ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>💬</button>
              <button onClick={() => setShowMediaControls(!showMediaControls)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showMediaControls ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{Icons.mic}</button>
              <button onClick={() => setShowEmotes(!showEmotes)} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${showEmotes ? 'bg-amber-400 text-slate-950 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>😊</button>
            </div>
            <button onClick={() => setCameraMode(prev => prev === 'first' ? 'third' : 'first')} className={`px-6 h-12 rounded-2xl font-black text-[10px] tracking-[0.25em] uppercase transition-all border ${cameraMode === 'third' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-inner' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
              Perspective: {cameraMode === 'first' ? '3RD' : '1ST'}
            </button>
            <div className="flex items-center gap-4 pl-4 group">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-800 shadow-xl">
                <img src={user?.picture || ''} className="w-full h-full object-cover" alt="avatar" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-wider leading-tight">{user?.name}</span>
                <span className="text-[9px] text-cyan-500/80 font-bold uppercase tracking-[0.3em] leading-tight">Nexus Node</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showGemini && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-10 w-[500px]">
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">AI Architect</h3>
            <input autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAI()} className="w-full bg-slate-800 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-cyan-500 mb-8 mt-4" placeholder="e.g., A collaborative design sprint" />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowGemini(false)} className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Close</button>
              <button onClick={runAI} disabled={loading} className="px-8 py-3 bg-cyan-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">{loading ? 'Processing...' : 'Apply Layout'}</button>
            </div>
          </div>
        </div>
      )}

      {showWorkspace && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-10 w-[600px]">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Google Workspace</h3>
            <input autoFocus value={workspaceUrl} onChange={e => setWorkspaceUrl(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-cyan-500 mb-8 mt-4" placeholder="https://docs.google.com/..." />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowWorkspace(false)} className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
              <button onClick={() => setShowWorkspace(false)} className="px-8 py-3 bg-cyan-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">Connect Screen</button>
            </div>
          </div>
        </div>
      )}

      {showAIAvatar && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-10 w-[600px] shadow-2xl">
            <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">AI Identity Architect</h3>
            {!generatedAvatarPreview ? (
              <div className="mt-6">
                <textarea
                  autoFocus
                  value={avatarPrompt}
                  onChange={e => setAvatarPrompt(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-cyan-500 h-32 resize-none text-sm"
                  placeholder="Describe your character..."
                />
                <div className="mt-8 flex justify-center">
                  <button onClick={generateAIAvatar} disabled={loading || !avatarPrompt} className="px-10 py-4 bg-cyan-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">
                    {loading ? 'Synthesizing...' : 'Generate Avatar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center mt-6">
                <img src={generatedAvatarPreview} className="w-64 h-64 mx-auto mb-8 rounded-2xl border-2 border-cyan-500 shadow-2xl" />
                <div className="flex justify-center gap-4">
                  <button onClick={() => setGeneratedAvatarPreview(null)} className="px-8 py-3 bg-white/5 text-white/50 rounded-xl font-bold uppercase tracking-widest text-[10px]">Retry</button>
                  <button onClick={useAIAvatar} className="px-10 py-4 bg-cyan-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">Enter with Selection</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <VRChat isOpen={showChat} onToggle={() => setShowChat(!showChat)} accentColor={config.wallColor} userName={user?.name || 'Guest'} />
      <EmotesPanel isOpen={showEmotes} onToggle={() => setShowEmotes(!showEmotes)} onEmote={(e) => { setCurrentEmote(e); setTimeout(() => setCurrentEmote(null), 3000); }} />
      <MediaControls isOpen={showMediaControls} onToggle={() => setShowMediaControls(!showMediaControls)} accentColor={config.wallColor} userName={user?.name || 'Guest'} />

      {/* 🖼️ 3D ENGINE */}
      <div className="absolute inset-0" onClick={() => { if (hasEntered) { const canvas = document.querySelector('#xr-canvas canvas') as HTMLCanvasElement; if (canvas && !document.pointerLockElement) canvas.requestPointerLock(); } }}>
        {/* VR Button MUST be outside Canvas but inside the container */}
        <XRButton
          mode="VR"
          sessionInit={{ optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] }}
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '24px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: '#06B6D4',
            border: '1px solid #06B6D4',
            zIndex: 10000000,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer'
          }}
        >
          {(status) => status === 'unsupported' ? 'VR Unsupported' : 'Enter VR'}
        </XRButton>

        <Canvas shadows id="xr-canvas" gl={{ antialias: true }} dpr={[1, 2]}>
          <XR>
            <Controllers />
            <Hands />

            <color attach="background" args={['#080810']} />
            {!isCustomEnv && <Stars radius={100} depth={50} count={2000} factor={4} />}
            <Environment preset="night" />
            <SceneLighting accentColor={config.wallColor} castShadows={true} />
            <Suspense fallback={null}>
              <Room
                config={config} spaceId={space.id} templateId={space.templateId} user={user || undefined} hasEntered={hasEntered}
                activeTool={activeTool} toolPayload={toolPayload} currentEmote={currentEmote || undefined} useColyseusMultiplayer={true} cameraMode={cameraMode}
                onSelectAvatar={handleSelectAvatar} multiplayer={multiplayer}
                assets={space.customAssets}
                customGlbUrl={space.customAssets?.find(a => a.type === 'model' && a.category === 'scene')?.url}
                colliderGlbUrl={space.customAssets?.find(a => a.type === 'model' && a.category === 'collider')?.url}
                space={space}
                isFullEnvironment={isCustomEnv}
                enableReflections={enableReflections}
                onUpdateUser={onUpdateUser}
              />
            </Suspense>
            <SceneErrorBoundary>
              {(() => {
                let skyboxUrl = space.customAssets?.find(a => a.category === 'skybox')?.url;
                if (!skyboxUrl) {
                  const sceneAsset = space.customAssets?.find(a => a.category === 'scene');
                  if (sceneAsset?.url) {
                    const basename = sceneAsset.url.split('/').pop()?.split('.')[0];
                    if (basename) skyboxUrl = `/assets/skyboxes/${basename}.png`;
                  }
                }

                if (skyboxUrl) {
                  return (
                    <Suspense fallback={null}>
                      <SmartEnvironment url={skyboxUrl} />
                    </Suspense>
                  );
                }
                return null;
              })()}
            </SceneErrorBoundary>
            <PerspectiveCamera makeDefault position={[0, 1.6, 5]} fov={75} />
            {hasEntered && <PointerLockControls selector="#xr-canvas" />}
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.9} mipmapBlur />
              <Vignette offset={0.3} darkness={0.5} />
              {enableAO && (
                <N8AO
                  intensity={1.0} // Reduced from 5.0
                  aoRadius={0.5}
                  distanceFalloff={2.0}
                />
              )}
              {enableDOF && (
                <DepthOfField
                  focusDistance={1.5} // where to focus
                  focalLength={0.01} // focal length
                  bokehScale={1} // bokeh size
                />
              )}
            </EffectComposer>
          </XR>
        </Canvas>
      </div>
    </div>
  );
};

export default XRPreview;