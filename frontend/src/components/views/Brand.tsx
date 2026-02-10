import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { Organization } from '../../types';

interface BrandProps {
    onUpdate?: () => void; // Callback to refresh app state
    orgId: string;
}

const Brand: React.FC<BrandProps> = ({ onUpdate, orgId }) => {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // File Inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrgData();
  }, [orgId]);

  const loadOrgData = async () => {
    try {
        const data = await api.org.get(orgId);
        setOrg(data);
    } catch (e) {
        console.error("Failed to load org", e);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!org) return;
    try {
        await api.org.updateBranding(org);
        alert("Branding settings saved successfully! Changes will persist.");
        if (onUpdate) onUpdate(); // Refresh main app session
    } catch (e) {
        alert("Failed to save settings.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroUrl') => {
    const file = e.target.files?.[0];
    if (file && org) {
        // In a real app, upload to storage first. Here we create a data URL for persistence.
        const reader = new FileReader();
        reader.onload = () => {
             setOrg({ ...org, [field]: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  if (loading || !org) return <div className="text-white">Loading brand settings...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Brand & Identity</h2>
        <button 
          onClick={handleSave}
          className="bg-gg-cyan text-gg-navy px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 shadow-lg shadow-cyan-900/20"
        >
          Save Changes
        </button>
      </div>

      <div className="bg-gg-navy-secondary p-8 rounded-xl border border-gray-700 space-y-8">
        
        {/* Logos */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Organization Logo</label>
            <input 
                type="file" 
                ref={logoInputRef} 
                className="hidden" 
                accept="image/png,image/jpeg"
                onChange={(e) => handleImageUpload(e, 'logoUrl')}
            />
            <div 
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg h-32 flex items-center justify-center hover:border-gg-cyan cursor-pointer transition bg-gg-navy relative"
            >
                {org.logoUrl ? (
                    <img src={org.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                    <span className="text-gray-500 text-sm">Upload Logo (PNG)</span>
                )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hero Image (VR Lobby)</label>
            <input 
                type="file" 
                ref={heroInputRef} 
                className="hidden" 
                accept="image/png,image/jpeg"
                onChange={(e) => handleImageUpload(e, 'heroUrl')}
            />
            <div 
                onClick={() => heroInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg h-32 flex items-center justify-center hover:border-gg-cyan cursor-pointer transition bg-gg-navy relative"
            >
                {org.heroUrl ? (
                    <img src={org.heroUrl} alt="Hero" className="h-full w-full object-cover" />
                ) : (
                    <span className="text-gray-500 text-sm">Upload Hero (JPG/PNG)</span>
                )}
            </div>
          </div>
        </div>

        {/* Colors */}
        <div>
          <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Brand Colors</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Primary</label>
              <div className="flex items-center bg-gg-navy p-2 rounded border border-gray-600">
                <input 
                  type="color" 
                  value={org.primaryColor}
                  onChange={e => setOrg({...org, primaryColor: e.target.value})}
                  className="bg-transparent border-0 w-8 h-8 cursor-pointer mr-2"
                />
                <span className="text-gray-300 font-mono text-sm">{org.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Secondary</label>
              <div className="flex items-center bg-gg-navy p-2 rounded border border-gray-600">
                <input 
                  type="color" 
                  value={org.secondaryColor}
                  onChange={e => setOrg({...org, secondaryColor: e.target.value})}
                  className="bg-transparent border-0 w-8 h-8 cursor-pointer mr-2"
                />
                <span className="text-gray-300 font-mono text-sm">{org.secondaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Accent</label>
              <div className="flex items-center bg-gg-navy p-2 rounded border border-gray-600">
                <input 
                  type="color" 
                  value={org.accentColor}
                  onChange={e => setOrg({...org, accentColor: e.target.value})}
                  className="bg-transparent border-0 w-8 h-8 cursor-pointer mr-2"
                />
                <span className="text-gray-300 font-mono text-sm">{org.accentColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div>
           <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Default Environment</h3>
           <select 
              value={org.defaultSpaceTemplateId}
              onChange={e => setOrg({...org, defaultSpaceTemplateId: e.target.value})}
              className="w-full bg-gg-navy border border-gray-600 rounded p-3 text-white focus:border-gg-cyan outline-none"
           >
             <option value="boardroom">Corporate Boardroom</option>
             <option value="studio">Design Studio</option>
             <option value="zen_lab">Zen Brainlab</option>
             <option value="expo_hall">Expo Hall</option>
             <option value="full_office">Full HQ Office</option>
           </select>
        </div>

      </div>
    </div>
  );
};

export default Brand;