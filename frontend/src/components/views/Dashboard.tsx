import React from 'react';
import { Space, Device, User, View } from '../../types';
import { api } from '../../services/api';
import { getSessionId } from '../../logic';

interface Props {
  user: User;
  setView: (v: View) => void;
}

const Dashboard: React.FC<Props> = ({ user, setView }) => {

  const handlePurge = async () => {
    if (confirm("⚠️ This will clear all online avatars. Useful if ghosts are stuck. Continue?")) {
      const myId = getSessionId();
      await api.multiplayer.adminPurgeGhosts(myId || 'unknown');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex justify-between items-end bg-gradient-to-r from-gg-navy-secondary to-gg-navy border border-gray-700 p-8 rounded-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name} 👋</h1>
          <p className="text-gray-400">Here is what's happening in your VR workspaces today.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePurge}
            className="bg-red-900/30 text-red-400 border border-red-900 px-4 py-2 rounded-lg font-bold hover:bg-red-900/50 transition text-sm"
          >
            ⚠️ Purge Ghosts
          </button>
          <button
            onClick={() => setView(View.SPACES)}
            className="bg-gg-cyan text-gg-navy px-6 py-2 rounded-lg font-bold hover:bg-cyan-400 transition"
          >
            Enter VR
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Sessions', val: '12', color: 'text-gg-cyan' },
          { label: 'Total Assets', val: '143', color: 'text-gg-purple' },
          { label: 'Online Devices', val: '8', color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-gg-navy-secondary p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</h3>
            <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gg-navy-secondary p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setView(View.IDEAS)}
              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg flex items-center transition"
            >
              <span className="text-xl mr-3">✨</span>
              <span className="text-gray-200">Generate New Space Idea</span>
            </button>
            <button
              onClick={() => setView(View.TEAM)}
              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg flex items-center transition"
            >
              <span className="text-xl mr-3">👤</span>
              <span className="text-gray-200">Invite Team Member</span>
            </button>
            <button
              onClick={() => setView(View.ASSETS)}
              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg flex items-center transition"
            >
              <span className="text-xl mr-3">📤</span>
              <span className="text-gray-200">Upload 3D Model</span>
            </button>
          </div>
        </div>

        <div className="bg-gg-navy-secondary p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { text: 'New asset "Office_Chair_V2.glb" uploaded', time: '10m ago' },
              { text: 'Meeting started in "Boardroom Alpha"', time: '25m ago' },
              { text: 'Device "Quest 2 - Lobby" came online', time: '1h ago' },
            ].map((act, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-0">
                <span className="text-gray-300">{act.text}</span>
                <span className="text-gray-500 text-xs">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nexus Intelligence Section */}
      <div className="bg-gradient-to-br from-gg-navy-secondary to-gg-navy p-8 rounded-2xl border border-gg-purple/30 shadow-2xl relative overflow-hidden group hover:border-gg-purple/60 transition-all cursor-pointer" onClick={() => setView(View.NEXUS_HUB)}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gg-purple/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-gg-purple/20 transition-all"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-20 h-20 bg-gg-purple/20 rounded-3xl flex items-center justify-center text-gg-purple shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"></path></svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Nexus Insight Core <span className="text-[10px] bg-gg-purple text-white px-2 py-0.5 rounded ml-2 font-black">ACTIVE</span></h3>
            <p className="text-gray-400 text-sm max-w-xl">Historical synchronization completes in 12ms. 8 new contextual alignments detected in your Spatial Archive since your last login.</p>
          </div>
          <button className="bg-gg-purple text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
            Launch Discovery
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;