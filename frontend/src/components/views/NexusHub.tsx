import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const NexusHub: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [findings, setFindings] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!query) return;
        setIsSearching(true);
        try {
            const data = await api.nexus.discovery(query);
            setFindings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 p-6">
            <header className="mb-12 relative">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-gg-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gg-purple to-gg-cyan flex items-center justify-center text-gg-navy">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002-2z"></path></svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-white tracking-tighter">Nexus Intelligence Hub</h2>
                    </div>
                    <p className="text-gray-400 max-w-2xl text-lg font-light">The enterprise-wide spatial knowledge graph. Search through every session, every canvas object, and every transcript across the platform.</p>
                </div>
            </header>

            {/* Search Interface */}
            <div className="bg-gg-navy-secondary p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl mb-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gg-cyan/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>

                <div className="relative z-10">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6">Discovery Query Processor</label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Enter keyword, project name, or historical context..."
                            className="flex-1 bg-gg-navy/50 border border-gray-700 rounded-2xl px-8 py-5 text-xl text-white focus:border-gg-cyan focus:ring-4 focus:ring-gg-cyan/10 outline-none transition-all placeholder-gray-600 font-light"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-gg-cyan text-gg-navy px-10 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-gg-cyan/20 disabled:opacity-50"
                        >
                            {isSearching ? 'SCANNIG...' : 'QUERY NEXUS'}
                        </button>
                    </div>

                    <div className="flex gap-3 mt-6">
                        {['Q4 Strategy', 'Supply Chain', 'Boardroom Archive', 'Retail 2026'].map(t => (
                            <button key={t} onClick={() => setQuery(t)} className="text-[10px] font-bold text-gray-500 hover:text-gg-cyan uppercase tracking-widest transition">
                                # {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Findings List */}
                <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gg-cyan"></span>
                        Knowledge Discoveries
                    </h3>

                    {findings.length === 0 ? (
                        <div className="bg-white/5 border border-dashed border-gray-800 rounded-3xl p-20 text-center">
                            <p className="text-gray-500 font-medium">Ready for input. Search the Nexus to surface archival alignment.</p>
                        </div>
                    ) : (
                        findings.map((f, i) => (
                            <div key={i} className="glass p-8 rounded-[2rem] border border-gg-cyan/10 hover:border-gg-cyan/30 transition-all group animate-in slide-in-from-left-4 duration-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="px-3 py-1 rounded-full bg-gg-cyan/10 text-gg-cyan text-[9px] font-bold uppercase tracking-widest border border-gg-cyan/20">
                                        Historical Match: {f.topic}
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-600">ID: {f.id}</span>
                                </div>
                                <p className="text-xl text-white font-medium mb-6 leading-tight group-hover:text-gg-cyan transition-colors">{f.context}</p>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Context Alignment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400">{(f.relevance * 100).toFixed(0)}% Confidence</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Real-time Graph View (Mocked) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#020617] border border-gg-purple/20 rounded-[2.5rem] p-8 relative overflow-hidden h-[500px] flex flex-col">
                        <h3 className="text-xs font-black text-gg-purple uppercase tracking-[0.3em] mb-6 relative z-10">Neural Hub Visualization</h3>

                        <div className="flex-1 relative flex items-center justify-center">
                            {/* Neural Core */}
                            <div className="w-32 h-32 rounded-full bg-gg-purple/20 border border-gg-purple/40 animate-pulse flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-gg-purple shadow-[0_0_50px_rgba(168,85,247,0.5)] flex items-center justify-center text-white">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                            </div>

                            {/* Orbiting Points (Mock) */}
                            {[0, 60, 120, 180, 240, 300].map(deg => (
                                <div
                                    key={deg}
                                    className="absolute w-4 h-4 rounded-full bg-gg-cyan border border-white/20 animate-bounce"
                                    style={{
                                        transform: `rotate(${deg}deg) translate(100px) rotate(-${deg}deg)`,
                                        animationDelay: `${deg / 100}s`
                                    }}
                                ></div>
                            ))}

                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                {[0, 1, 2, 3, 4, 5].map(i => (
                                    <line key={i} x1="50%" y1="50%" x2={`${20 + i * 15}%`} y2={`${20 + (i % 2) * 40}%`} stroke="#a855f7" strokeWidth="1" strokeDasharray="4 4" />
                                ))}
                            </svg>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Platform Health</p>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-green-400">● Intelligence Online</span>
                                <span className="text-gray-600">Sync: 12ms</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gg-purple/5 border border-gg-purple/20 rounded-3xl p-6">
                        <h4 className="text-[10px] font-black text-gg-purple uppercase tracking-widest mb-3">Nexus Auto-Index</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">The Nexus automatically indexes spatial audio transcripts and canvas state every 5 minutes during live sessions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NexusHub;
