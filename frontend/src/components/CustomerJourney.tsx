
import React, { useState } from 'react';
import { User, Session } from '../types';
import { api } from '../services/api';
import { saveUserToFirestore } from '../logic';

interface Props {
    session: Session;
    onComplete: (updatedSession: Session) => void;
}

const CustomerJourney: React.FC<Props> = ({ session, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('');
    const [intent, setIntent] = useState('');

    const roles = [
        'Executive Leader',
        'Project Manager',
        'Product Designer',
        'Software Engineer',
        'Marketing Manager',
        'Consultant',
        'Other'
    ];

    const intents = [
        'Remote Collaboration',
        'Strategic Planning',
        'Customer Presentation',
        'Education & Training',
        'Technical Review',
        'Other'
    ];

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Try to update profile in backend (non-critical)
            await Promise.race([
                api.team.updateProfile({
                    displayName: session.user.name,
                    avatarUrl: session.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=06B6D4&color=fff&size=128`,
                    hasCompletedOnboarding: true // ✅ Save status to DB so it doesn't show again
                }),
                new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000))
            ]).catch(e => console.warn("Profile update skipped:", e));
        } catch (e) {
            console.warn("Profile API unavailable, continuing:", e);
        }
        // Always proceed to workspace — don't let API failures block the user
        const updatedUser: User = {
            ...session.user,
            businessRole: role,
            primaryIntent: intent,
            hasCompletedOnboarding: true
        };

        // 💾 CRITICAL: Save directly to Firestore from client (bypassing potentially broken API)
        saveUserToFirestore(updatedUser).catch(e => console.warn("Local save failed", e));

        onComplete({
            ...session,
            user: updatedUser
        });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gg-navy overflow-hidden">
            {/* Background aesthetics */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1920&q=80')] bg-cover opacity-20 blur-xl"></div>

            <div className="relative z-10 max-w-xl w-full mx-4 bg-gg-navy-secondary/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] p-10 overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-gg-cyan/30 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gg-purple/30 rounded-full blur-[80px]"></div>

                <div className="relative">
                    <header className="mb-10 text-center">
                        {/* 🌟 LOGO */}
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-gg-cyan to-gg-purple rounded-2xl flex items-center justify-center shadow-lg shadow-gg-cyan/20 transform rotate-3 hover:rotate-6 transition-transform">
                            <span className="text-5xl font-black text-white select-none">G</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            Welcome to GreenGalaxy <span className="text-sm align-super bg-gg-cyan/20 text-gg-cyan px-2 py-1 rounded-lg border border-gg-cyan/50">v0.2</span>
                        </h2>
                        <p className="text-gray-400">Tell us a bit about yourself to customize your VR workspace.</p>
                    </header>

                    <div className="space-y-8">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gg-cyan uppercase tracking-widest mb-4">Your Professional Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                {roles.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${role === r
                                            ? 'bg-gg-cyan/20 border-gg-cyan text-gg-cyan shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Intent Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gg-purple uppercase tracking-widest mb-4">Primary Intent Today</label>
                            <div className="grid grid-cols-2 gap-3">
                                {intents.map(i => (
                                    <button
                                        key={i}
                                        onClick={() => setIntent(i)}
                                        className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${intent === i
                                            ? 'bg-gg-purple/20 border-gg-purple text-gg-purple shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <footer className="mt-12">
                        <button
                            onClick={handleComplete}
                            disabled={!role || !intent || loading}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${!role || !intent || loading
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-gg-cyan to-gg-purple text-white shadow-lg hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Preparing Workspace...</span>
                                </div>
                            ) : 'Enter Environment'}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default CustomerJourney;
