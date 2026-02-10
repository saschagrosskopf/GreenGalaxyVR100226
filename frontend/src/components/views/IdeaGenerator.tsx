import React, { useState } from 'react';
import { api } from '../../services/api';
import { Space, User, View, SceneObject } from '../../types';

interface IdeaGeneratorProps {
  user: User;
  setView: (v: View) => void;
  onPreview: (space: Space) => void;
}

const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ user, setView, onPreview }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [objects, setObjects] = useState<SceneObject[] | null>(null);
  const [atmospherePrompt, setAtmospherePrompt] = useState('');

  const activeModel = user.labsTool || 'gemini-1.5-pro';

  const handleForgeArchitecture = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      // Step 1: Generate 3D Architecture using selected Gemini model
      const data = await api.ai.generateWorkshopLayout(prompt, activeModel);
      setObjects(data);

      // Step 2: Generate Atmosphere Prompt for Imagen 3
      setAtmospherePrompt(`A high-fidelity spherical 8k equirectangular skybox environment for: ${prompt}. Cinematic lighting, highly detailed surface textures, professionally rendered.`);

    } catch (e) {
      console.error(e);
      alert("Forge synchronization failed. Check Nexus-OS connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgeReality = async () => {
    if (!objects) return;
    setLoading(true);
    try {
      const spaceName = `Forged: ${prompt.split(' ').slice(0, 3).join(' ')}...`;
      const newSpace: Space = {
        id: `forge_${Date.now()}`,
        name: spaceName,
        status: 'ready',
        templateId: 'custom',
        updatedAt: new Date().toISOString(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=800&q=80',
        orgId: user.orgId || 'org_def'
      };

      // Create the space record
      await api.spaces.create(newSpace);

      // Hydrate with the generated objects
      for (const obj of objects) {
        await api.scenes.addSceneObject(newSpace.id, obj);
      }

      alert("✨ REALITY MANIFESTED. Entering Immersion...");
      onPreview(newSpace);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-2">Spatial Forge <span className="text-gg-cyan text-sm align-top font-mono tracking-widest ml-2">V2.0 ALPHA</span></h2>
          <p className="text-gray-400">Collaborative LLM-to-Reality Engine powered by Google Labs.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Engine: {activeModel}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-gg-navy-secondary p-8 rounded-[2rem] border border-gray-700 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gg-purple/5 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-gg-purple/10 transition-all"></div>

            <label className="block text-[10px] font-black text-gg-cyan uppercase tracking-[0.3em] mb-4">Input Neural Prompt</label>
            <textarea
              className="w-full h-40 bg-gg-navy/50 border border-gray-600/50 rounded-2xl p-6 text-xl text-white focus:border-gg-purple focus:ring-4 focus:ring-gg-purple/10 outline-none mb-6 transition-all placeholder-gray-600 block leading-relaxed"
              placeholder="e.g. A futuristic command center for a galactic fleet, featuring central holographic tables and deep indigo ambient lighting..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />

            <div className="flex flex-wrap gap-3 mb-8">
              {['Zen Brainlab', 'Tactical HQ', 'Creative Loft', 'Retail Showroom'].map(tag => (
                <button key={tag} onClick={() => setPrompt(tag)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest transition">
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Latency Prediction</span>
                <span className="text-xs font-mono text-cyan-400">1.2s via Gemini 1.5 Subspace</span>
              </div>
              <button
                onClick={handleForgeArchitecture}
                disabled={loading || !prompt}
                className="bg-gradient-to-r from-gg-purple to-gg-cyan text-gg-navy px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 transition-all duration-300"
              >
                {loading ? 'CALIBRATING...' : 'Initialize Forge Architecture'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        {objects && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Architecture Preview */}
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gg-purple/20 rounded-xl flex items-center justify-center text-gg-purple">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white">Architecture Plan</h3>
              </div>

              <div className="space-y-3 mb-8">
                {objects.map((obj, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-gg-purple text-xs font-mono">#{i.toString().padStart(2, '0')}</span>
                      <span className="text-sm text-gray-300 font-medium uppercase tracking-wider">{obj.type}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">[{obj.pos.x}, {obj.pos.y}, {obj.pos.z}]</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-gg-cyan font-bold block mb-1">Nexus Integration Note:</span>
                These objects will be generated as persistent entities in your spatial graph.
              </p>
            </div>

            {/* Atmosphere Panel */}
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-gg-cyan/10 to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 relative">
                <div className="w-10 h-10 bg-gg-cyan/20 rounded-xl flex items-center justify-center text-gg-cyan">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9b-9-9m9 9c1.657 0 3-1.343 3-3s-1.343-3-3-3m0 6c-1.657 0-3-1.343-3-3s1.343-3 3-3m-9 0h9"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white">Atmosphere Protocol</h3>
              </div>

              <div className="p-5 bg-gg-navy/50 border border-gg-cyan/20 rounded-2xl mb-8 relative">
                <h4 className="text-[10px] font-black text-gg-cyan uppercase tracking-widest mb-2">Imagen 3 Generation Stream</h4>
                <p className="text-gray-400 text-xs italic leading-relaxed">{atmospherePrompt}</p>
              </div>

              <div className="space-y-4 relative">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Environment Preset</span>
                  <span className="text-[10px] font-mono text-gg-cyan">Cinematic High-Dynamic</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Asset Sync Status</span>
                  <span className="text-[10px] font-mono text-gg-cyan">READY TO MANIFEST</span>
                </div>
              </div>

              <button
                onClick={handleForgeReality}
                disabled={loading}
                className="w-full mt-10 bg-white text-gg-navy py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gg-cyan hover:scale-[1.02] shadow-2xl transition-all duration-300 active:scale-95"
              >
                {loading ? 'MANIFESTING REALITY...' : 'Forge Reality & Enter Immersion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaGenerator;