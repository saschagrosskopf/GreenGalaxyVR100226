import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';
import RPMAvatarCreator from '../RPMAvatarCreator';

interface ProfileProps {
    user: User;
    onUpdateProfile?: (updates: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile }) => {
    // Local state for form inputs
    const [displayName, setDisplayName] = useState(user.name);
    const [vrAvatar, setVrAvatar] = useState(user.avatarUrl || 'a1');
    const [isGoogleConnected, setIsGoogleConnected] = useState(true);
    const [showAvatarCreator, setShowAvatarCreator] = useState(false);

    const handleAvatarExported = async (url: string) => {
        setVrAvatar(url);
        setShowAvatarCreator(false);
        // Auto-save when avatar is forged for better UX
        if (onUpdateProfile) {
            onUpdateProfile({ avatarUrl: url });
        }
        await api.team.updateProfile({ displayName, avatarUrl: url });
    };

    const handleSaveProfile = async () => {
        await api.team.updateProfile({ displayName, avatarUrl: vrAvatar });

        // Notify parent to update global session state
        if (onUpdateProfile) {
            onUpdateProfile({ name: displayName, avatarUrl: vrAvatar });
        }

        alert("Profile updated successfully");
    };



    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">

            {/* Profile Header */}
            <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-gg-cyan to-gg-purple">
                            <img src={user.picture} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-gg-navy" />
                        </div>
                        <button className="absolute bottom-1 right-1 bg-gg-cyan p-1.5 rounded-full text-gg-navy hover:scale-110 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    </div>
                    <div className="ml-6">
                        <h2 className="text-3xl font-bold text-white">{displayName}</h2>
                        <p className="text-gg-purple font-medium">{user.email}</p>
                        <p className="text-gray-400 text-sm mt-1">Member since: November 2025</p>
                    </div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gg-cyan">Integrations</h3>

            {/* Integrations Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Workspace */}
                <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        </div>
                        <h4 className="text-xl font-bold text-white">Google Workspace</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Connect your Google account to enable calendar scheduling and cloud storage for your 3D models.</p>
                    <button
                        onClick={() => setIsGoogleConnected(!isGoogleConnected)}
                        className={`w-full px-6 py-3 rounded-lg font-bold transition ${isGoogleConnected
                            ? 'bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                            }`}
                    >
                        {isGoogleConnected ? 'Account Connected' : 'Connect Account'}
                    </button>
                </div>

                {/* Labs.google (Gemini) */}
                <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gg-purple/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-gg-purple/20 transition-all"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gg-purple/10 flex items-center justify-center text-gg-purple">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h4 className="text-xl font-bold text-white">Labs.google</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isGoogleConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                            {isGoogleConnected ? 'Google Linked' : 'Account Required'}
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Enable Gemini-powered spatial architecture and real-time session summarization with Labs.google.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Select Active Intelligence Tool</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['gemini-pro', 'gemini-flash', 'imagen-3'].map(tool => (
                                    <button
                                        key={tool}
                                        onClick={() => onUpdateProfile && onUpdateProfile({ ...user, labsTool: tool as any })}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${user.labsTool === tool
                                            ? 'bg-gg-purple/20 border-gg-purple text-gg-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                                    >
                                        {tool.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {!isGoogleConnected && (
                            <button
                                onClick={() => setIsGoogleConnected(true)}
                                className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 transition"
                            >
                                Re-verify Google Account for Labs Access
                            </button>
                        )}
                    </div>
                </div>

                {/* Mixboard.google */}
                <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gg-cyan/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-gg-cyan/20 transition-all"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gg-cyan/10 flex items-center justify-center text-gg-cyan">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                            </div>
                            <h4 className="text-xl font-bold text-white">Mixboard.google</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-gg-cyan/20 text-gg-cyan border-gg-cyan/30`}>
                            {user.hasCompletedMixboardOnboarding ? 'Onboarded' : 'Tutorial Pending'}
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Integrate your Infinite Mixboard across all spatial sessions for cross-canvas project management.</p>

                    <button
                        onClick={() => {
                            alert("Launching Mixboard Interactive Onboarding Suite...");
                            if (onUpdateProfile) onUpdateProfile({ ...user, hasCompletedMixboardOnboarding: true });
                        }}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border ${user.hasCompletedMixboardOnboarding
                            ? 'bg-gg-cyan/10 border-gg-cyan text-gg-cyan'
                            : 'bg-gg-cyan text-gg-navy border-gg-cyan shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]'
                            }`}
                    >
                        {user.hasCompletedMixboardOnboarding ? 'Restart Mixboard Help' : 'Start Help & Onboarding'}
                    </button>
                </div>

                {/* Nexus Intelligence */}
                <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <h4 className="text-xl font-bold text-white">Nexus Indexing</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Connect to the "Green Galaxy" historical index for deep context-aware search during sessions.</p>
                    <button className="w-full px-6 py-3 rounded-lg font-bold border border-gray-700 text-gray-400 hover:text-white hover:bg-white/5 transition">
                        Configure Index Connections
                    </button>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gg-cyan">Account Settings</h3>

            {/* Account Settings */}
            <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
                <h4 className="text-xl font-bold text-white mb-6">Profile Customization</h4>

                <div className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="w-full bg-gg-navy border border-gray-600 rounded p-3 text-white focus:border-gg-purple outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">This name will be visible to others in VR sessions and invite links.</p>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-3">VR Avatar Identity (Ready Player Me)</label>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            {['a1', 'a2', 'a3'].map((id) => (
                                <button
                                    key={id}
                                    onClick={() => setVrAvatar(id)}
                                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${vrAvatar === id ? 'border-gg-cyan ring-4 ring-gg-cyan/20' : 'border-gray-700 hover:border-gray-600'}`}
                                >
                                    <img src={`https://models.readyplayer.me/${id === 'a1' ? '64bfa15f0e72c63d7c3934a6' : id === 'a2' ? '64bfa15f0e72c63d7c3934a7' : '64bfa15f0e72c63d7c3934a8'}.png`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                            <div className={`flex items-center justify-center border-2 border-dashed rounded-xl ${!['a1', 'a2', 'a3'].includes(vrAvatar) ? 'border-gg-purple' : 'border-gray-700'}`}>
                                <span className="text-[10px] text-gray-500 text-center px-2">Custom Link Active</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="https://models.readyplayer.me/your-id.glb"
                                value={vrAvatar.startsWith('http') ? vrAvatar : ''}
                                onChange={e => setVrAvatar(e.target.value)}
                                className="flex-1 bg-gg-navy border border-gray-600 rounded p-3 text-white focus:border-gg-purple outline-none text-sm"
                            />
                            <button
                                onClick={handleSaveProfile}
                                className="bg-gg-cyan text-gg-navy font-bold px-6 py-2 rounded hover:bg-cyan-400 transition whitespace-nowrap"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                    </div>

                    {showAvatarCreator && (
                        <RPMAvatarCreator
                            onAvatarExported={handleAvatarExported}
                            onClose={() => setShowAvatarCreator(false)}
                        />
                    )}
                </div>
            </div>

            <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gg-cyan/10 rounded-full flex items-center justify-center mb-4 text-gg-cyan">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Immersive Presence</h3>
                <p className="text-gray-400 text-sm max-w-md mb-6">
                    GreenGalaxy uses high-fidelity spatial avatars. Create your professional 3D persona to represent you in virtual meetings and workshops.
                </p>
                <button
                    onClick={() => setShowAvatarCreator(true)}
                    className="bg-gg-cyan text-gg-navy font-black px-8 py-3 rounded-full hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest text-xs"
                >
                    Forge New Avatar
                </button>
            </div>

        </div>
    );
};

export default Profile;