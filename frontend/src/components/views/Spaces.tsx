import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Space, View } from '../../types';

interface SpacesProps {
  setView?: (v: View) => void;
  onPreview?: (space: Space) => void;
  orgId: string;
}

const Spaces: React.FC<SpacesProps> = ({ setView, onPreview, orgId }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceData, setNewSpaceData] = useState({ name: '', mode: '1', template: '1', workshopTemplate: '0' });

  // Demo spaces for investor pitch - always visible
  const DEMO_SPACES: Space[] = [
    {
      id: 'demo_boardroom',
      name: 'Executive Boardroom',
      status: 'live',
      templateId: 'custom',
      updatedAt: new Date().toISOString(),
      thumbnailUrl: '/assets/thumbnails/boardroom.jpg',
      orgId: 'org_def',
      customAssets: [
        {
          id: 'env_boardroom',
          name: 'Boardroom Environment',
          type: 'model',
          url: '/assets/environments/boardroom.glb',
          size: 0,
          category: 'scene'
        },
        {
          id: 'env_colliders',
          name: 'Boardroom Colliders',
          type: 'model',
          url: '/assets/environments/boardroom_colliders.glb',
          size: 0,
          category: 'collider'
        }
      ],
      // @ts-ignore
      spawnPoint: [0, 0, 5],
      // @ts-ignore
      envOffset: [0, -2, 0],
      // @ts-ignore
      screenConfig: {
        workspace: { position: [-12, 2, 12], rotation: [0, -20, 0], size: [5, 2.8] },
        calendar: null,
        notes: null
      },
      castShadows: false
    },
    {
      id: 'demo_showroom',
      name: 'Luxury Car Showroom',
      status: 'live',
      templateId: 'template_showroom',
      updatedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      orgId: 'org_def'
    },
    {
      id: 'demo_command',
      name: 'Bluforce Office',
      status: 'live',
      templateId: 'template_command',
      updatedAt: new Date().toISOString(),
      thumbnailUrl: '/assets/thumbnails/Bluforce.jpg',
      orgId: 'org_def',
      customAssets: [
        {
          id: 'env_bluforce',
          name: 'Bluforce Environment',
          type: 'model',
          url: '/assets/environments/Bluforce.glb',
          size: 0,
          category: 'scene'
        },
        {
          id: 'env_office_colliders',
          name: 'Office Colliders',
          type: 'model',
          url: '/assets/environments/office_colliders.glb',
          size: 0,
          category: 'collider'
        }
      ],
      // @ts-ignore
      spawnPoint: [0, 0, 5],
      // @ts-ignore
      envOffset: [0, 0, 0],
      // @ts-ignore
      screenConfig: {
        workspace: null,
        calendar: null,
        notes: null
      },
      castShadows: false
    },
    {
      id: 'demo_studio',
      name: 'Creative Studio',
      status: 'ready',
      templateId: 'template_studio',
      updatedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
      orgId: 'org_def'
    },
    {
      id: 'demo_whiteboard',
      name: 'Infinite Canvas Workshop',
      status: 'ready',
      templateId: 'template_whiteboard',
      updatedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      orgId: 'org_def'
    },
    {
      id: 'demo_zen',
      name: 'Zen Brainlab',
      status: 'ready',
      templateId: 'template_zen',
      updatedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80',
      orgId: 'org_def'
    }
  ];

  useEffect(() => {
    loadSpaces();
  }, [orgId]);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const realSpaces = await api.spaces.list(orgId);
      // Filter out demo spaces if they already exist in real data to avoid duplicates
      const uniqueDemoSpaces = DEMO_SPACES.filter(ds => !realSpaces.find(rs => rs.id === ds.id));
      setSpaces([...realSpaces, ...uniqueDemoSpaces]);
    } catch (e) {
      console.error("Firestore sync failed, using local archive:", e);
      setSpaces(DEMO_SPACES);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!newSpaceData.name) return;

    let templateId = 'template_boardroom';
    let workshopTemplateId: string | undefined = undefined;

    if (newSpaceData.mode === '2') {
      const templates = api.spaces.getWorkshopTemplates();
      const selectedIndex = parseInt(newSpaceData.workshopTemplate);
      if (templates[selectedIndex]) {
        workshopTemplateId = templates[selectedIndex].id;
        templateId = workshopTemplateId;
      }
    } else {
      const t = newSpaceData.template;
      if (t === '1') templateId = 'template_boardroom';
      if (t === '2') templateId = 'template_studio';
      if (t === '3') templateId = 'template_zen';
      if (t === '4') templateId = 'template_expo';
      if (t === '5') templateId = 'template_whiteboard';
    }

    const newSpace: Space = {
      id: `space_${Date.now()}`,
      name: newSpaceData.name,
      status: 'ready',
      templateId: templateId,
      updatedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
      orgId
    };

    setShowCreateModal(false);
    setNewSpaceData({ name: '', mode: '1', template: '1', workshopTemplate: '0' });

    try {
      console.log(`🏗️ Creating space ${newSpace.name} with template ${templateId}...`);
      await api.spaces.create(newSpace, workshopTemplateId);
      console.log(`✅ Space created and hydrated successfully!`);
      setSpaces(prev => [newSpace, ...prev]);
    } catch (e) {
      console.error("Space creation failed:", e);
      alert("Failed to create space. Please try again.");
    }
  };


  const handleDelete = async (id: string, name: string) => {
    const verification = prompt(`To delete "${name}", type "DELETE":`);
    if (verification === 'DELETE') {
      await api.spaces.delete(id);
      setSpaces(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleJoin = (space: Space) => {
    const sessionId = `sess_${Date.now()}`;
    const deepLink = `greengalaxy://join?spaceId=${space.id}&sessionId=${sessionId}`;
    window.location.href = deepLink;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://placehold.co/800x450/1e293b/06b6d4?text=VR+Space';
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-gg-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 animate-pulse">Initializing Spatial Archive...</p>
      </div>
    </div>
  );

  const workshopTemplates = api.spaces.getWorkshopTemplates();

  return (
    <div className="h-full flex flex-col relative">
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gg-navy border border-gray-700 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-6">Forge New Space</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Space Name</label>
                <input
                  type="text"
                  value={newSpaceData.name}
                  onChange={e => setNewSpaceData({ ...newSpaceData, name: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gg-cyan outline-none transition"
                  placeholder="e.g. Q4 Strategy Room"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Purpose</label>
                <select
                  value={newSpaceData.mode}
                  onChange={e => setNewSpaceData({ ...newSpaceData, mode: e.target.value })}
                  className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gg-cyan outline-none transition"
                >
                  <option value="1">Standard Layout</option>
                  <option value="2">Interactive Workshop</option>
                </select>
              </div>
              {newSpaceData.mode === '1' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Layout Template</label>
                  <select
                    value={newSpaceData.template}
                    onChange={e => setNewSpaceData({ ...newSpaceData, template: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gg-cyan outline-none transition"
                  >
                    <option value="1">Boardroom</option>
                    <option value="2">Creative Studio</option>
                    <option value="3">Zen Brainlab</option>
                    <option value="4">Expo Hall</option>
                    <option value="5">Infinite Canvas</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Workshop Scenario</label>
                  <select
                    value={newSpaceData.workshopTemplate}
                    onChange={e => setNewSpaceData({ ...newSpaceData, workshopTemplate: e.target.value })}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gg-cyan outline-none transition"
                  >
                    {workshopTemplates.map((t, i) => (
                      <option key={t.id} value={i}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-bold text-gray-400 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                disabled={!newSpaceData.name}
                className="flex-1 bg-gg-cyan text-gg-navy px-4 py-2 rounded-lg font-bold hover:bg-cyan-400 transition disabled:opacity-50"
              >
                Create Space
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Spatial Archives</h2>
          <p className="text-gray-400 text-sm">Deploy and manage enterprise immersion modules.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gg-cyan text-gg-navy px-6 py-2.5 rounded-full font-bold hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add Space
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {spaces.map(space => (
          <div key={space.id} className="bg-gg-navy-secondary rounded-2xl overflow-hidden border border-gray-800/50 group hover:border-gg-cyan/30 transition duration-500 shadow-xl flex flex-col hover:-translate-y-1">
            <div className="h-52 bg-gray-900 relative overflow-hidden shrink-0">
              <img
                src={space.thumbnailUrl}
                alt={space.name}
                onError={handleImageError}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition duration-700 blur-[1px] group-hover:blur-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gg-navy via-gg-navy/20 to-transparent"></div>
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${space.status === 'live' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                space.status === 'ready' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}>
                {space.status}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-gg-cyan transition-colors">{space.name}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{new Date(space.updatedAt).toLocaleDateString()}</p>
                  <span className="text-[10px] font-black text-gg-cyan bg-gg-cyan/5 px-2 py-1 rounded border border-gg-cyan/10 uppercase tracking-tighter">
                    {space.templateId.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button
                  onClick={() => onPreview && onPreview(space)}
                  className="w-full bg-white text-gg-navy hover:bg-gg-cyan transition-colors text-xs py-3 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95"
                >
                  Enter Immersion
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] py-2.5 rounded-lg border border-white/10 font-bold uppercase tracking-widest transition">
                    Configure
                  </button>
                  <button
                    onClick={() => handleJoin(space)}
                    className="bg-white/5 hover:bg-white/10 text-gg-cyan text-[10px] py-2.5 rounded-lg border border-gg-cyan/10 font-bold uppercase tracking-widest transition"
                  >
                    Native App
                  </button>
                </div>
                {!space.id.startsWith('seed_') && (
                  <button
                    onClick={() => handleDelete(space.id, space.name)}
                    className="text-[10px] text-gray-600 hover:text-red-400 font-bold uppercase tracking-widest transition mt-2 text-center"
                  >
                    Decommission
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowCreateModal(true)}
          className="border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 text-gray-600 hover:text-gg-cyan hover:border-gg-cyan/50 hover:bg-gg-cyan/5 transition-all duration-500 h-full min-h-[340px] group"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-800 group-hover:border-gg-cyan flex items-center justify-center mb-4 transition-colors">
            <span className="text-4xl font-thin">+</span>
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">New Deployment</span>
        </button>
      </div>
    </div>
  );
};

export default Spaces;