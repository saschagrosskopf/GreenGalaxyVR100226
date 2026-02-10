import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Space, User } from '../../types';

interface PublishProps {
    user: User;
}

const Publish: React.FC<PublishProps> = ({ user }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    api.spaces.list(user.orgId).then(setSpaces);
  }, [user.orgId]);

  const copyLink = (id: string) => {
    // Append the user's display name to the deep link
    const link = `greengalaxy://join?spaceId=${id}&sessionId=${Date.now()}&playerName=${encodeURIComponent(user.name)}`;
    navigator.clipboard.writeText(link);
    alert("Deep Link copied to clipboard! (Includes your Display Name)");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Publish & Deep Links</h2>
      <p className="text-gray-400 mb-6">Share these links to invite others to your VR spaces. Links automatically include your current display name: <span className="text-gg-cyan">{user.name}</span></p>
      
      <div className="bg-gg-navy-secondary border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/20 text-gray-400 uppercase">
            <tr>
              <th className="px-6 py-4">Space Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Deep Link Preview</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-300">
            {spaces.map(s => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs uppercase ${s.status === 'live' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500 max-w-md truncate">
                    greengalaxy://join?spaceId={s.id}...&playerName={encodeURIComponent(user.name)}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => copyLink(s.id)}
                    className="text-gg-cyan hover:text-white font-semibold transition bg-gg-cyan/10 px-3 py-1 rounded border border-gg-cyan/30"
                  >
                    Copy Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Publish;