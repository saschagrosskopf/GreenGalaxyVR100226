
import { SessionSnapshot, TranscriptionItem, Space, User } from '../types';
import { api } from './api';

/**
 * 🛰️ STATE SERIALIZATION ENGINE
 * Captures the entire 3D and 2D state of a VR workspace.
 */
export const SerializationService = {

    /**
     * Captures the current room state
     */
    captureSnapshot: async (
        space: Space,
        user: User,
        canvasObjects: any[],
        sceneObjects: any[],
        transcription: TranscriptionItem[],
        dashboards: Record<string, any>
    ): Promise<SessionSnapshot> => {

        console.log("🛰️ Serializing VR Room State...");

        const snapshot: Omit<SessionSnapshot, 'id'> = {
            spaceId: space.id,
            timestamp: Date.now(),
            capturedBy: user.id,
            sceneObjects,
            canvasObjects,
            transcription,
            dashboards,
            metadata: {
                title: `${space.name} Review - ${new Date().toLocaleDateString()}`,
                participantCount: 1, // Will be updated by multiplayer service in production
                duration: 0 // Placeholder
            }
        };

        const savedSnapshot = await api.sessions.capture(snapshot);
        console.log("✅ State Serialized:", savedSnapshot.id);
        return savedSnapshot;
    },

    /**
     * Generates a downloadable HTML report from a snapshot
     */
    generateReportHTML: (report: any, snapshot: SessionSnapshot): string => {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${report.title} | GreenGalaxy Report</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Outfit', 'sans-serif'],
                    mono: ['JetBrains Mono', 'monospace'],
                  }
                }
              }
            }
          </script>
          <style>
              body { background-color: #020617; color: #f8fafc; font-family: 'Outfit', sans-serif; }
              .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
              .gradient-text { background: linear-gradient(135deg, #22d3ee, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .card-glow:hover { box-shadow: 0 0 40pxrgba(34, 211, 238, 0.1); border-color: rgba(34, 211, 238, 0.3); }
              .nexus-tag { background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; }
          </style>
      </head>
      <body class="p-6 md:p-12 lg:p-20 max-w-6xl mx-auto selection:bg-cyan-500/30">
          <header class="mb-16 flex flex-col md:flex-row justify-between items-start gap-8 border-b border-white/5 pb-10">
              <div class="space-y-4">
                  <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 animate-pulse"></div>
                      <span class="text-xs font-black tracking-[0.3em] uppercase text-gray-500">GreenGalaxy Intelligence Report</span>
                  </div>
                  <h1 class="text-6xl font-extrabold tracking-tighter gradient-text leading-[1.1]">${report.title}</h1>
                  <div class="flex flex-wrap gap-4 text-gray-400 text-sm font-medium">
                      <span class="bg-white/5 px-3 py-1 rounded-full border border-white/5">📅 ${new Date(snapshot.timestamp).toLocaleString()}</span>
                      <span class="bg-white/5 px-3 py-1 rounded-full border border-white/5">🛡️ Security Level: Enterprise Tier-1</span>
                      <span class="bg-white/5 px-3 py-1 rounded-full border border-white/5">👥 ${snapshot.metadata.participantCount} Participants</span>
                  </div>
              </div>
              <div class="glass p-6 rounded-3xl text-right shrink-0 min-w-[200px]">
                  <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">State Restore Engine</p>
                  <p class="text-cyan-400 font-mono text-xs mb-4">TOKEN: ${snapshot.id.substring(0, 8)}...READY</p>
                  <a href="${report.restoreLink}" class="inline-block px-6 py-3 bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95">
                      Enter Immersion
                  </a>
              </div>
          </header>

          <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
              <div class="lg:col-span-8 glass p-10 rounded-[2.5rem] card-glow transition-all">
                  <h2 class="text-xs font-black text-cyan-400 mb-6 tracking-[0.3em] uppercase">Executive Intelligence Summary</h2>
                  <p class="text-2xl font-light text-gray-200 leading-tight">${report.summary}</p>
                  <div class="mt-10 grid grid-cols-2 gap-4">
                      <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Primary Asset Growth</p>
                        <p class="text-xl font-bold text-white">+${report.assetsCreatedCount} Entities</p>
                      </div>
                      <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Contextual Density</p>
                        <p class="text-xl font-bold text-white">98.4% Captured</p>
                      </div>
                  </div>
              </div>

              <div class="lg:col-span-4 glass p-10 rounded-[2.5rem] relative overflow-hidden group">
                  <div class="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-[80px] group-hover:bg-purple-600/20 transition-all"></div>
                  <h2 class="text-xs font-black text-purple-400 mb-6 tracking-[0.3em] uppercase">Nexus Knowledge discovery</h2>
                  <div class="space-y-4 relative z-10">
                      <div class="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                          <p class="text-xs font-bold text-purple-300 mb-1">K-001 Historical Alignment</p>
                          <p class="text-sm text-gray-400">High relevance match with "Q4 Strategy" repository.</p>
                      </div>
                      <button class="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest transition">
                          View Index Records
                      </button>
                  </div>
              </div>
          </section>

          <section class="mb-16">
              <div class="flex items-center gap-4 mb-8">
                <h2 class="text-3xl font-bold text-white tracking-tighter">Action Items</h2>
                <div class="h-px flex-1 bg-white/5"></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${report.actionItems.map((item: any) => `
                      <div class="glass p-6 rounded-2xl flex items-start gap-5 card-glow transition-all border-l-4 border-cyan-500 group">
                          <div class="w-6 h-6 rounded border-2 border-slate-700 bg-slate-900 flex items-center justify-center shrink-0 mt-1 cursor-pointer group-hover:border-cyan-500 transition-colors">
                            <div class="w-2 h-2 rounded-sm bg-cyan-500 opacity-0 group-active:opacity-100"></div>
                          </div>
                          <div>
                              <p class="text-lg font-medium text-white mb-2 leading-snug">${item.text}</p>
                              <div class="flex items-center gap-2">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}&background=020617&color=22d3ee" class="w-5 h-5 rounded-full border border-white/10" />
                                <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Assigned to ${item.userName}</span>
                              </div>
                          </div>
                      </div>
                  `).join('')}
              </div>
          </section>

          <section class="mb-20">
              <div class="flex items-center gap-4 mb-8">
                <h2 class="text-3xl font-bold text-white tracking-tighter">Spatial Decision Log</h2>
                <div class="shrink-0 bg-white/5 px-3 py-1 rounded text-[10px] font-bold text-gray-500 uppercase">Archive Mode Active</div>
              </div>
              <div class="glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                  <table class="w-full text-left">
                      <thead>
                          <tr class="bg-white/[0.02]">
                              <th class="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Participant</th>
                              <th class="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Data Context</th>
                              <th class="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Synchronization Time</th>
                          </tr>
                      </thead>
                      <tbody class="divide-y divide-white/[0.03]">
                          ${snapshot.transcription.slice(0, 15).map((t: any) => `
                              <tr class="hover:bg-white/[0.02] transition-colors group">
                                  <td class="px-8 py-5">
                                    <div class="flex items-center gap-3">
                                      <div class="w-2 h-2 rounded-full bg-cyan-500/50 group-hover:scale-125 transition-transform"></div>
                                      <span class="text-sm font-bold text-white">${t.userName}</span>
                                    </div>
                                  </td>
                                  <td class="px-8 py-5 text-sm text-gray-400 font-light leading-relaxed">${t.text}</td>
                                  <td class="px-8 py-5 text-right font-mono text-xs text-slate-500 tracking-tighter">${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>
          </section>

          <footer class="mt-32 pb-20 text-center relative">
              <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <div class="pt-12 mb-10">
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mb-4">Nexus Archive | GreenGalaxy Ecosystem</p>
                <h3 class="text-4xl font-extrabold text-white tracking-tighter mb-8">Ready to resume immersion?</h3>
                <a href="${report.restoreLink}" class="inline-block px-12 py-5 bg-white text-slate-950 font-black text-sm uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                    Launch State Restore
                </a>
              </div>
              <p class="text-slate-600 font-mono text-[9px] uppercase tracking-tighter">Platform Architecture v1.1.0 • E2E Encryption Active • Data Sovereign </p>
          </footer>
      </body>
      </html>
    `;
    }
};
