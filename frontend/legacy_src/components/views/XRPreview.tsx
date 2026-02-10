import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Organization, RoomConfig, Space, User } from '../../types';
import { Room } from '../xr/Room';
import { api } from '../../services/api';

interface Props {
  org: Organization | null;
  space: Space | null;
  user: User | null;
  onExit: () => void;
}

const XRPreview: React.FC<Props> = ({ org, space, user, onExit }) => {
  const [config] = useState<RoomConfig>({
    wallColor: org?.primaryColor || '#06B6D4',
    logoUrl: org?.logoUrl,
    furnitureMap: org?.furnitureMap
  });

  const [isLocked, setIsLocked] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  
  // TOOLBAR STATE
  const [activeTool, setActiveTool] = useState<'cursor' | 'sticky' | 'sticker' | 'eraser'>('cursor');
  const [toolPayload, setToolPayload] = useState<string>(''); 
  
  // AI STATE
  const [showGemini, setShowGemini] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnter = () => {
    setHasEntered(true);
    const canvas = document.querySelector('#xr-canvas');
    if (canvas) (canvas as HTMLElement).requestPointerLock();
  };

  const handleExit = async () => {
    const myId = sessionStorage.getItem('gg_player_id');
    if (myId) await api.multiplayer.removeUser(myId);
    onExit();
  };

  const runAI = async () => {
      if(!aiPrompt || !space) return;
      setLoading(true);
      try {
          const layout = await api.ai.generateWorkshopLayout(aiPrompt);
          for (const obj of layout) {
              await api.scenes.addSceneObject(space.id, obj);
          }
          setShowGemini(false);
          setAiPrompt('');
          handleEnter();
      } catch(e) {
          alert("Gemini Architect disconnected.");
      } finally {
          setLoading(false);
      }
  };

  const handlePurge = async () => {
      if (confirm("⚠️ NUCLEAR RESET: Clear all items and ghosts?")) {
          const myId = sessionStorage.getItem('gg_player_id');
          await api.multiplayer.adminPurgeGhosts(myId || 'unknown');
          window.location.reload();
      }
  };

  const selectTool = (tool: 'cursor' | 'sticky' | 'sticker' | 'eraser', payload: string = '') => {
      setActiveTool(tool);
      setToolPayload(payload);
  };

  if (!space) return <div className="fixed inset-0 bg-gg-navy flex items-center justify-center">Loading GreenGalaxy Space...</div>;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black z-[100] overflow-hidden">
      
      {/* --- WORKSHOP TOOLBAR --- */}
      {hasEntered && (
        <div className="miro-toolbar-fixed">
          <div className="toolbar-label">ARCHITECT</div>
          
          <button onClick={() => selectTool('sticky', 'New Task')} style={{ background: '#ffeaa7' }} className={`tool-btn ${activeTool === 'sticky' ? 'active-ring' : ''}`} title="Sticky Note">📝</button>
          <button onClick={() => selectTool('sticker', '🚀')} style={{ background: '#fab1a0' }} className={`tool-btn ${activeTool === 'sticker' ? 'active-ring' : ''}`} title="Launch Sticker">🚀</button>
          <button onClick={() => selectTool('eraser')} style={{ background: '#b2bec3' }} className={`tool-btn ${activeTool === 'eraser' ? 'active-ring' : ''}`} title="Delete Item">🧹</button>

          <div className="toolbar-divider"></div>

          <button onClick={() => { setShowGemini(true); document.exitPointerLock(); }} style={{ background: '#a29bfe', color: 'white' }} className="tool-btn" title="AI Build">✨</button>
          
          <div className="toolbar-divider"></div>

          <button onClick={handlePurge} style={{ background: '#ff7675', color: 'white' }} className="tool-btn" title="Reset All">♻️</button>
          <button onClick={handleExit} style={{ background: '#dfe6e9' }} className="tool-btn" title="Leave">🚪</button>
        </div>
      )}

      <style>{`
        .miro-toolbar-fixed {
          position: fixed !important;
          left: 20px !important; top: 50% !important; transform: translateY(-50%) !important;
          z-index: 99999999 !important; display: flex !important; flex-direction: column !important; gap: 12px !important;
          background: rgba(255,255,255,0.9) !important; backdrop-filter: blur(10px) !important;
          padding: 15px !important; border-radius: 20px !important; box-shadow: 0 20px 50px rgba(0,0,0,0.3) !important;
        }
        .toolbar-label { font-size: 9px; color: #888; font-weight: 900; margin-bottom: 5px; text-align: center; }
        .tool-btn { width: 44px; height: 44px; border: none; border-radius: 12px; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.1s; }
        .tool-btn:hover { transform: scale(1.1); }
        .active-ring { outline: 4px solid #06B6D4; outline-offset: 2px; }
        .toolbar-divider { height: 1px; background: #ddd; margin: 4px 0; }
      `}</style>

      {/* --- GEMINI MODAL --- */}
      {showGemini && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
           <div className="bg-white p-10 rounded-3xl shadow-2xl w-[450px] text-center border border-white/20">
              <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">✨ Gemini Architect</h3>
              <p className="text-gray-500 mb-6">Describe your workshop goal:</p>
              <input autoFocus className="w-full border-2 border-gray-100 rounded-xl p-4 mb-6 text-xl outline-none focus:border-purple-400" placeholder="e.g. SWOT Analysis for Q1" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAI()} />
              <div className="flex gap-3">
                  <button onClick={runAI} disabled={loading} className="flex-1 bg-gg-navy text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50">{loading ? 'Constructing...' : 'Build Scene'}</button>
                  <button onClick={() => { setShowGemini(false); handleEnter(); }} className="px-6 py-4 text-gray-400 font-bold">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {/* --- ENTRY SCREEN --- */}
      {!hasEntered && (
          <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-gg-navy">
              <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1621619856624-42fd193a0661?auto=format&fit=crop&w=1920&q=80')] bg-cover"></div>
              <div className="relative text-center p-16 border border-gg-cyan/30 rounded-[40px] bg-gg-navy/90 backdrop-blur-xl shadow-2xl max-w-xl">
                  <div className="mb-4 text-gg-cyan text-sm font-bold tracking-widest uppercase"> Branded Space Ready </div>
                  <h2 className="text-5xl text-white font-bold mb-4">{space.name}</h2>
                  <p className="text-gray-400 mb-10 text-lg">Secure immersion active. Syncing with GreenGalaxy Cloud...</p>
                  <button onClick={handleEnter} className="w-full bg-gradient-to-r from-gg-cyan to-gg-purple text-gg-navy font-black text-2xl px-8 py-6 rounded-2xl shadow-2xl hover:scale-105 transition transform active:scale-95"> START SESSION </button>
              </div>
          </div>
      )}

      <Canvas id="xr-canvas" shadows>
        <PerspectiveCamera makeDefault position={[0, 1.7, 6]} fov={70} />
        <color attach="background" args={['#0B1120']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-10, 5, -10]} intensity={0.8} color={config.wallColor} />

        <Suspense fallback={null}>
            <PointerLockControls selector="#xr-canvas" onLock={() => setIsLocked(true)} onUnlock={() => setIsLocked(false)} />
            <Room 
                config={config} 
                templateId={space.templateId} 
                assets={space.customAssets}
                user={user || undefined}
                hasEntered={hasEntered} 
                spaceId={space.id}
                activeTool={activeTool}
                toolPayload={toolPayload}
            />
            <Environment preset="city" background={false} blur={1} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default XRPreview;