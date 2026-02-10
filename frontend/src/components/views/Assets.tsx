import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Asset, Session, View, FurnitureMap } from '../../types';

interface AssetsProps {
  session?: Session;
  setView?: (v: View) => void;
}

// Asset categories
type AssetCategory = 'scene' | 'furniture';
type UploadMode = 'personal' | 'marketplace';

// Marketplace item interface
interface MarketplaceItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  thumbnail: string;
  downloads: string;
  category?: string;
  author?: string;
  isOwned?: boolean;
}

// Sample marketplace data
const MARKETPLACE_SCENES: MarketplaceItem[] = [
  { id: 'mp_scene_1', name: 'Modern Office HQ', description: 'A sleek modern office environment', price: 'Free', thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', downloads: '2.4k', author: 'GreenGalaxy' },
  { id: 'mp_scene_2', name: 'Creative Studio Loft', description: 'Open-plan creative space', price: '$49', thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80', downloads: '1.8k', author: 'DesignLab' },
  { id: 'mp_scene_3', name: 'Zen Garden Meeting', description: 'Peaceful outdoor meeting space', price: '$29', thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80', downloads: '956', author: 'ZenSpaces' },
  { id: 'mp_scene_4', name: 'Futuristic Command Center', description: 'Sci-fi inspired control room', price: '$79', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', downloads: '3.1k', author: 'FutureTech' },
];

const MARKETPLACE_FURNITURE: MarketplaceItem[] = [
  { id: 'mp_furn_1', name: 'Executive Leather Chair', description: 'Premium office seating', price: 'Free', thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80', category: 'Chair', downloads: '5.2k', author: 'FurniturePro' },
  { id: 'mp_furn_2', name: 'Standing Desk Pro', description: 'Adjustable height desk', price: '$19', thumbnail: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80', category: 'Table', downloads: '3.7k', author: 'DeskMaster' },
  { id: 'mp_furn_3', name: 'Modern Floor Lamp', description: 'Contemporary lighting', price: 'Free', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', category: 'Lamp', downloads: '2.1k', author: 'LightWorks' },
  { id: 'mp_furn_4', name: 'Abstract Wall Art', description: 'Modern art piece', price: '$9', thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=400&q=80', category: 'Art', downloads: '1.5k', author: 'ArtStudio' },
];

// Premium Icon Components (SVG-based, Google-style)
const Icons = {
  scene: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  furniture: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  store: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  ),
  sell: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  create: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  cube: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  file: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  chair: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21v-4m14 4v-4M7 9h10a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2zM9 4v5m6-5v5" />
    </svg>
  ),
  table: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v.75H3.75V6zM3.75 9.75h16.5M6 20.25V9.75m12 10.5V9.75" />
    </svg>
  ),
  lamp: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m0-3a6 6 0 006-6V7.5a.75.75 0 00-.75-.75h-10.5a.75.75 0 00-.75.75V12a6 6 0 006 6zm6-12H6m9 15H9" />
    </svg>
  ),
  art: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
};

const Assets: React.FC<AssetsProps> = ({ session, setView }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [furnitureMap, setFurnitureMap] = useState<FurnitureMap>({});
  const [activeTab, setActiveTab] = useState<AssetCategory>('scene');
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [selectedSceneAsset, setSelectedSceneAsset] = useState<Asset | null>(null);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('personal');
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>('scene');
  const [marketplaceForm, setMarketplaceForm] = useState({
    name: '',
    description: '',
    price: 'free',
    customPrice: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    try {
      const list = await api.assets.list();
      setAssets(list);

      if (session) {
        const org = await api.org.get(session.org.id);
        if (org.furnitureMap) setFurnitureMap(org.furnitureMap);
      }
    } catch (e) {
      console.error("Failed to load assets", e);
    }
  };

  const openUploadModal = (category: AssetCategory, mode: UploadMode = 'personal') => {
    setUploadCategory(category);
    setUploadMode(mode);
    setShowUploadModal(true);
    setSelectedFile(null);
    setUploadProgress(0);
    setMarketplaceForm({ name: '', description: '', price: 'free', customPrice: '', tags: '' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      const fileName = files[0].name.replace(/\.(glb|gltf|png|jpg|jpeg)$/i, '');
      setMarketplaceForm(prev => ({ ...prev, name: prev.name || fileName }));
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const uploadedAsset = await api.assets.upload(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (marketplaceForm.name) {
        uploadedAsset.name = marketplaceForm.name;
      }

      if (uploadCategory === 'scene' && !uploadedAsset.name.toLowerCase().includes('scene')) {
        uploadedAsset.name = `Scene_${uploadedAsset.name}`;
      }

      setAssets(prev => [...prev, uploadedAsset]);

      if (uploadCategory === 'scene' && uploadedAsset.type === 'model') {
        setSelectedSceneAsset(uploadedAsset);
      }

      if (uploadMode === 'marketplace') {
        alert(`Asset "${marketplaceForm.name}" submitted for marketplace review.\n\nPrice: ${marketplaceForm.price === 'free' ? 'Free' : '$' + marketplaceForm.customPrice}`);
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadProgress(0);

    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this asset permanently?`)) {
      try {
        await api.assets.delete(id);
        setAssets(prev => prev.filter(a => a.id !== id));
        if (selectedSceneAsset?.id === id) {
          setSelectedSceneAsset(null);
        }
      } catch (e) {
        console.error("Delete failed:", e);
      }
    }
  };

  const handleCreateSpaceFromScene = async (asset?: Asset) => {
    // Get all model assets to include in the space (both GLB and GLTF files)
    // Get all model assets to include in the space (be resilient to .glb/.gltf extension if type is 'image')
    const allModelAssets = assets.filter(a => a.type === 'model' || /\.(glb|gltf)$/i.test(a.name));

    if (!session) {
      alert("Authentication required.");
      return;
    }

    if (allModelAssets.length === 0) {
      alert("No model assets available. Upload GLB/GLTF files first.");
      return;
    }

    // Use selected asset name for default, or first model name
    const defaultName = (asset || selectedSceneAsset || allModelAssets[0])?.name.replace(/\.(glb|gltf)$/i, '') || 'Custom Space';
    const name = prompt("Space name:", defaultName);
    if (!name) return;

    setCreatingSpace(true);

    try {
      // Pass ALL model assets (GLB + GLTF) to create the space
      await api.spaces.createCustom(name, allModelAssets, session.org.id);
      if (setView) setView(View.SPACES);
    } catch (e) {
      console.error("Error:", e);
      alert("Failed to create space.");
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleEquip = async (asset: Asset, slot: keyof FurnitureMap) => {
    if (!session || asset.type !== 'model') return;

    const newMap = { ...furnitureMap, [slot]: asset.url };
    setFurnitureMap(newMap);

    try {
      await api.org.update(session.org.id, { furnitureMap: newMap });
    } catch (e) {
      setFurnitureMap(furnitureMap);
    }
  };

  const handleUnequip = async (slot: keyof FurnitureMap) => {
    if (!session) return;

    const newMap = { ...furnitureMap };
    delete newMap[slot];
    setFurnitureMap(newMap);

    try {
      await api.org.update(session.org.id, { furnitureMap: newMap });
    } catch (e) {
      console.error("Failed to unequip:", e);
    }
  };

  const handleDownloadMarketplaceItem = (item: MarketplaceItem) => {
    if (item.price !== 'Free') {
      alert(`Purchase required: ${item.price}`);
    } else {
      alert(`"${item.name}" added to your library.`);
    }
  };

  const slotIcons: Record<string, React.ReactNode> = {
    chairUrl: Icons.chair,
    tableUrl: Icons.table,
    lampUrl: Icons.lamp,
    artUrl: Icons.art,
  };

  return (
    <div className="pb-12">
      {/* ==================== UPLOAD MODAL ==================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-medium text-white">
                {uploadMode === 'marketplace' ? 'Publish to Marketplace' : 'Upload Asset'}
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-white transition p-1 hover:bg-white/5 rounded"
              >
                {Icons.close}
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Upload Mode Toggle */}
              <div className="flex gap-1 p-1 bg-black/30 rounded-lg">
                <button
                  onClick={() => setUploadMode('personal')}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition ${uploadMode === 'personal'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Personal Library
                </button>
                <button
                  onClick={() => setUploadMode('marketplace')}
                  className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition ${uploadMode === 'marketplace'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Sell on Marketplace
                </button>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Asset Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUploadCategory('scene')}
                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2 ${uploadCategory === 'scene'
                      ? 'bg-white/5 border-white/20 text-white'
                      : 'border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                      }`}
                  >
                    {Icons.scene}
                    Full Scene
                  </button>
                  <button
                    onClick={() => setUploadCategory('furniture')}
                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2 ${uploadCategory === 'furniture'
                      ? 'bg-white/5 border-white/20 text-white'
                      : 'border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                      }`}
                  >
                    {Icons.furniture}
                    Asset
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">File</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".glb,.gltf,.png,.jpg,.jpeg"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`border rounded-lg p-6 text-center transition ${selectedFile ? 'border-white/20 bg-white/5' : 'border-dashed border-white/10 hover:border-white/20'
                    }`}>
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-gray-400">{Icons.file}</div>
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-gray-500 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-500 mb-2 flex justify-center">{Icons.upload}</div>
                        <p className="text-gray-400 text-sm">Drop files here or click to browse</p>
                        <p className="text-gray-600 text-xs mt-1">GLB, GLTF, PNG, JPG</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Marketplace fields */}
              {uploadMode === 'marketplace' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Name</label>
                    <input
                      type="text"
                      value={marketplaceForm.name}
                      onChange={(e) => setMarketplaceForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition placeholder:text-gray-600"
                      placeholder="Asset name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      value={marketplaceForm.description}
                      onChange={(e) => setMarketplaceForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition resize-none h-20 placeholder:text-gray-600"
                      placeholder="Describe your asset"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Pricing</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMarketplaceForm(prev => ({ ...prev, price: 'free' }))}
                        className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${marketplaceForm.price === 'free'
                          ? 'bg-white/5 border-white/20 text-white'
                          : 'border-white/5 text-gray-500 hover:border-white/10'
                          }`}
                      >
                        Free
                      </button>
                      <button
                        onClick={() => setMarketplaceForm(prev => ({ ...prev, price: 'paid' }))}
                        className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${marketplaceForm.price === 'paid'
                          ? 'bg-white/5 border-white/20 text-white'
                          : 'border-white/5 text-gray-500 hover:border-white/10'
                          }`}
                      >
                        Paid
                      </button>
                      {marketplaceForm.price === 'paid' && (
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            value={marketplaceForm.customPrice}
                            onChange={(e) => setMarketplaceForm(prev => ({ ...prev, customPrice: e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-lg pl-7 pr-4 py-2.5 text-white text-sm focus:border-white/30 outline-none transition"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${selectedFile && !uploading
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {uploading ? 'Uploading...' : uploadMode === 'marketplace' ? 'Publish' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Assets</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage 3D models and create immersive VR spaces
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-1 mb-6 border-b border-white/5">
        <button
          onClick={() => { setActiveTab('scene'); setShowMarketplace(false); }}
          className={`px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${activeTab === 'scene'
            ? 'border-white text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          {Icons.scene}
          Scenes
        </button>
        <button
          onClick={() => { setActiveTab('furniture'); setShowMarketplace(false); }}
          className={`px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-px ${activeTab === 'furniture'
            ? 'border-white text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
          {Icons.furniture}
          Assets & Furniture
        </button>
      </div>

      {/* ==================== SCENES TAB ==================== */}
      {activeTab === 'scene' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => openUploadModal('scene', 'personal')}
              className="bg-white text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center gap-2"
            >
              {Icons.upload}
              Upload
            </button>

            <button
              onClick={() => openUploadModal('scene', 'marketplace')}
              className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
            >
              {Icons.sell}
              Sell
            </button>

            <button
              onClick={() => setShowMarketplace(!showMarketplace)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border ${showMarketplace
                ? 'bg-white/5 border-white/20 text-white'
                : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
            >
              {Icons.store}
              Marketplace
            </button>

            <div className="flex-1" />

            <button
              onClick={() => handleCreateSpaceFromScene()}
              disabled={creatingSpace || !selectedSceneAsset}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${selectedSceneAsset
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
            >
              {Icons.create}
              {creatingSpace ? 'Creating...' : 'Create Space'}
            </button>
          </div>

          {/* Marketplace Panel */}
          {showMarketplace && (
            <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Scene Marketplace</h3>
                <span className="text-xs text-gray-500">{MARKETPLACE_SCENES.length} available</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MARKETPLACE_SCENES.map(item => (
                  <div key={item.id} className="bg-black/30 rounded-lg overflow-hidden group hover:ring-1 hover:ring-white/20 transition">
                    <div className="h-28 relative overflow-hidden">
                      <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className={`absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded font-medium ${item.price === 'Free' ? 'bg-emerald-500/90 text-white' : 'bg-white text-gray-900'
                        }`}>{item.price}</span>
                    </div>
                    <div className="p-3">
                      <h4 className="text-white text-sm font-medium truncate">{item.name}</h4>
                      <p className="text-gray-600 text-xs mt-0.5">{item.author} · {item.downloads}</p>
                      <button
                        onClick={() => handleDownloadMarketplaceItem(item)}
                        className="w-full mt-2 bg-white/5 text-white text-xs py-1.5 rounded font-medium hover:bg-white/10 transition flex items-center justify-center gap-1"
                      >
                        {Icons.download}
                        {item.price === 'Free' ? 'Download' : 'Purchase'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scene Models Grid */}
          <div className="bg-[#1a1f2e] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Your Scenes</h3>
              {selectedSceneAsset && (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                  Selected: {selectedSceneAsset.name}
                </span>
              )}
            </div>

            {assets.filter(a => a.type === 'model' || /\.(glb|gltf)$/i.test(a.name)).length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-600 mb-3 flex justify-center">{Icons.cube}</div>
                <p className="text-gray-400 text-sm font-medium mb-1">No scenes uploaded</p>
                <p className="text-gray-600 text-xs mb-4">Upload a GLB file to create VR spaces</p>
                <button
                  onClick={() => openUploadModal('scene', 'personal')}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  Upload Scene
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {assets.filter(a => a.type === 'model' || /\.(glb|gltf)$/i.test(a.name)).map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedSceneAsset(asset)}
                    className={`bg-black/30 rounded-lg p-4 cursor-pointer transition-all ${selectedSceneAsset?.id === asset.id
                      ? 'ring-1 ring-white/30 bg-white/5'
                      : 'hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedSceneAsset?.id === asset.id ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'
                        }`}>
                        {Icons.cube}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium truncate">{asset.name}</h4>
                        <p className="text-gray-600 text-xs">3D Model</p>
                      </div>
                      {selectedSceneAsset?.id === asset.id && (
                        <span className="text-emerald-400">{Icons.check}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreateSpaceFromScene(asset); }}
                        className="flex-1 bg-white/5 text-white text-xs py-2 rounded-md font-medium hover:bg-white/10 transition"
                        disabled={creatingSpace}
                      >
                        Create Space
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                        className="px-3 py-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition"
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== FURNITURE TAB ==================== */}
      {activeTab === 'furniture' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => openUploadModal('furniture', 'personal')}
              className="bg-white text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center gap-2"
            >
              {Icons.upload}
              Upload
            </button>

            <button
              onClick={() => openUploadModal('furniture', 'marketplace')}
              className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
            >
              {Icons.sell}
              Sell
            </button>

            <button
              onClick={() => setShowMarketplace(!showMarketplace)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border ${showMarketplace
                ? 'bg-white/5 border-white/20 text-white'
                : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
            >
              {Icons.store}
              Marketplace
            </button>
          </div>

          {/* Marketplace Panel */}
          {showMarketplace && (
            <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Asset Marketplace</h3>
                <span className="text-xs text-gray-500">{MARKETPLACE_FURNITURE.length} available</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MARKETPLACE_FURNITURE.map(item => (
                  <div key={item.id} className="bg-black/30 rounded-lg overflow-hidden group hover:ring-1 hover:ring-white/20 transition">
                    <div className="h-28 relative overflow-hidden">
                      <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded font-medium bg-white/10 text-white backdrop-blur-sm">{item.category}</span>
                      <span className={`absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded font-medium ${item.price === 'Free' ? 'bg-emerald-500/90 text-white' : 'bg-white text-gray-900'
                        }`}>{item.price}</span>
                    </div>
                    <div className="p-3">
                      <h4 className="text-white text-sm font-medium truncate">{item.name}</h4>
                      <p className="text-gray-600 text-xs mt-0.5">{item.author} · {item.downloads}</p>
                      <button
                        onClick={() => handleDownloadMarketplaceItem(item)}
                        className="w-full mt-2 bg-white/5 text-white text-xs py-1.5 rounded font-medium hover:bg-white/10 transition flex items-center justify-center gap-1"
                      >
                        {Icons.download}
                        {item.price === 'Free' ? 'Download' : 'Purchase'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Slots */}
          <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Active Equipment</h3>
              <span className="text-xs text-gray-600">Drag & drop to equip</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['chairUrl', 'tableUrl', 'lampUrl', 'artUrl'] as const).map((slotKey) => {
                const isEquipped = !!furnitureMap[slotKey];
                const label = slotKey.replace('Url', '');

                return (
                  <div
                    key={slotKey}
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${isEquipped
                      ? 'bg-white/5 border-white/20'
                      : 'border-dashed border-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className={`mb-2 ${isEquipped ? 'text-white' : 'text-gray-600'}`}>
                      {slotIcons[slotKey]}
                    </div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                    {isEquipped ? (
                      <>
                        <span className="text-[10px] text-emerald-400 mb-2">Custom</span>
                        <button
                          onClick={() => handleUnequip(slotKey)}
                          className="text-[10px] text-gray-500 hover:text-red-400 transition"
                        >
                          Reset
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-600">Standard</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-[#1a1f2e] border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-black/30 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-medium">Preview</th>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Assign</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/5">
                          {asset.type === 'image' ? (
                            <img src={asset.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500">{Icons.cube}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white text-sm font-medium max-w-xs truncate">{asset.name}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wider ${asset.type === 'model'
                          ? 'bg-violet-500/10 text-violet-400'
                          : 'bg-sky-500/10 text-sky-400'
                          }`}>
                          {asset.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {asset.type === 'model' ? (
                          <div className="flex gap-1.5">
                            {(['chairUrl', 'tableUrl', 'lampUrl', 'artUrl'] as const).map(slot => (
                              <button
                                key={slot}
                                onClick={() => handleEquip(asset, slot)}
                                className={`px-2.5 py-1.5 text-[10px] rounded font-medium uppercase tracking-wider transition ${furnitureMap[slot] === asset.url
                                  ? 'bg-white text-gray-900'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                  }`}
                              >
                                {slot.replace('Url', '')}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-gray-500 hover:text-red-400 transition p-1.5 hover:bg-red-500/10 rounded"
                        >
                          {Icons.trash}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assets.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-gray-600 mb-3 flex justify-center">{Icons.furniture}</div>
                <p className="text-gray-400 text-sm font-medium mb-1">No assets uploaded</p>
                <p className="text-gray-600 text-xs mb-4">Add 3D models to customize your spaces</p>
                <button
                  onClick={() => openUploadModal('furniture', 'personal')}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  Upload Asset
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;