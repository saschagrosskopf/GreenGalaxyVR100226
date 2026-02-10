import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Organization } from '../../types';

interface OrgSettingsProps {
    orgId: string;
}

const OrgSettings: React.FC<OrgSettingsProps> = ({ orgId }) => {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app we would fetch the specific org ID
    api.org.get(orgId).then((data) => {
        setOrg(data);
        setLoading(false);
    });
  }, [orgId]);

  if (loading || !org) return <div className="text-white">Loading settings...</div>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6">Organization Settings</h2>
      
      {/* General Settings */}
      <div className="bg-gg-navy-secondary p-8 rounded-xl border border-gray-700 space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">General Information</h3>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Organization Name</label>
          <input type="text" value={org.name} disabled className="w-full bg-gg-navy/50 border border-gray-700 text-gray-500 rounded p-3" />
          <p className="text-xs text-gray-500 mt-1">Contact support to rename your organization.</p>
        </div>
        <div>
           <label className="block text-sm text-gray-400 mb-1">Billing Email</label>
           <input type="email" defaultValue={org.billingEmail || "billing@greengalaxy.tech"} className="w-full bg-gg-navy border border-gray-600 text-white rounded p-3 focus:border-gg-cyan outline-none" />
        </div>
        <div className="pt-6 border-t border-gray-700">
          <h4 className="text-red-400 font-bold mb-2">Danger Zone</h4>
          <p className="text-sm text-gray-400 mb-4">Deleting your organization will remove all spaces, assets, and user data. This action cannot be undone.</p>
          <button className="text-red-400 border border-red-900 bg-red-900/10 px-4 py-2 rounded hover:bg-red-900/30 transition">
            Delete Organization
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrgSettings;