import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { processAppRequest } from '../../services/gemini';
import { AppMode, WorkspaceState, RoomConfig } from '../../types';

interface SmartWhiteboardProps {
  position: [number, number, number];
  rotation: [number, number, number];
  roomConfig: RoomConfig;
  onUpdateConfig: (config: RoomConfig) => void;
}

export const SmartWhiteboard: React.FC<SmartWhiteboardProps> = ({ position, rotation, roomConfig, onUpdateConfig }) => {
  const [state, setState] = useState<WorkspaceState>({
    currentInput: '',
    generatedContent: '',
    isLoading: false,
    activeApp: AppMode.DASHBOARD,
    emails: [
      { id: 1, subject: 'Project Alpha Kickoff', from: 'sarah@company.com', body: 'Hi Team, looking forward to our meeting...' },
      { id: 2, subject: 'Q4 Budget Review', from: 'finance@company.com', body: 'Please review the attached spreadsheets...' },
    ],
    calendarEvents: [
      { id: 1, title: 'Weekly Sync', time: '10:00 AM' },
      { id: 2, title: 'Design Review', time: '2:00 PM' },
    ]
  });

  const handleGenerate = async () => {
    if (!state.currentInput.trim() && state.activeApp !== AppMode.DOCS) return;

    setState(prev => ({ ...prev, isLoading: true }));

    // For docs, if empty input, use "Help me write" generic prompt
    const input = state.currentInput || (state.activeApp === AppMode.DOCS ? "Write a generic business introduction" : "");

    const content = await processAppRequest(state.activeApp, input);

    if (state.activeApp === AppMode.CALENDAR) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        calendarEvents: [...prev.calendarEvents, { id: Date.now(), title: content.substring(0, 30) + '...', time: 'New' }],
        generatedContent: content,
        currentInput: ''
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        generatedContent: content
      }));
    }
  };

  const SidebarItem = ({ mode, icon }: { mode: AppMode, icon: string }) => (
    <button
      onClick={() => setState(prev => ({ ...prev, activeApp: mode, generatedContent: '', currentInput: '' }))}
      className={`p-4 w-full flex items-center gap-3 transition-colors ${state.activeApp === mode
          ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
          : 'text-gray-500 hover:bg-gray-50'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium text-sm">{mode}</span>
    </button>
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Physical Board Backing */}
      <mesh>
        <boxGeometry args={[4.2, 2.7, 0.1]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Board Frame */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[4.3, 2.8, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Interactive UI Overlay */}
      <Html
        transform
        occlude
        position={[0, 0, 0.06]}
        style={{ width: '900px', height: '550px', userSelect: 'none' }}
      >
        <div className="w-full h-full bg-white shadow-2xl rounded-xl flex overflow-hidden border border-gray-200 text-left">

          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-xl">
                <span className="text-blue-600">G</span>Workspace
              </div>
            </div>

            <div className="flex-1 py-4">
              <SidebarItem mode={AppMode.DASHBOARD} icon="🏠" />
              <SidebarItem mode={AppMode.MAIL} icon="✉️" />
              <SidebarItem mode={AppMode.DOCS} icon="📄" />
              <SidebarItem mode={AppMode.CALENDAR} icon="📅" />
            </div>

            <div className="mt-auto border-t border-gray-100">
              <SidebarItem mode={AppMode.SETTINGS} icon="⚙️" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-gray-50 flex flex-col relative">

            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between">
              <h2 className="text-xl font-semibold text-gray-800">{state.activeApp}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full ${state.isLoading ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                {state.isLoading ? 'Gemini Thinking...' : 'Gemini Ready'}
              </div>
            </div>

            {/* Content View */}
            <div className="flex-1 p-8 overflow-y-auto">

              {/* DASHBOARD VIEW (BRIEFING) */}
              {state.activeApp === AppMode.DASHBOARD && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Daily Briefing</h1>
                    <p className="opacity-90">Welcome to your immersive office. You have {state.emails.length} unread emails and {state.calendarEvents.length} events today.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setState(prev => ({ ...prev, activeApp: AppMode.MAIL }))}>
                      <h3 className="font-bold text-gray-700 mb-2">✉️ Mail</h3>
                      <p className="text-sm text-gray-500">Check your inbox or draft new messages with AI.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setState(prev => ({ ...prev, activeApp: AppMode.CALENDAR }))}>
                      <h3 className="font-bold text-gray-700 mb-2">📅 Calendar</h3>
                      <p className="text-sm text-gray-500">Your next meeting is at {state.calendarEvents[0]?.time || 'Unknown'}.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* MAIL VIEW */}
              {state.activeApp === AppMode.MAIL && (
                <div className="flex gap-6 h-full">
                  <div className="w-1/3 space-y-3 overflow-y-auto pr-2">
                    {state.emails.map(email => (
                      <div key={email.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-all">
                        <div className="font-bold text-gray-800 text-sm">{email.from}</div>
                        <div className="text-blue-600 font-medium text-sm truncate">{email.subject}</div>
                        <div className="text-gray-400 text-xs mt-1 truncate">{email.body}</div>
                      </div>
                    ))}
                  </div>
                  <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">Compose with Gemini</div>
                    <textarea
                      className="flex-1 p-4 outline-none resize-none text-gray-700 text-sm"
                      placeholder="Briefly describe the email you want to write..."
                      value={state.currentInput}
                      onChange={(e) => setState(prev => ({ ...prev, currentInput: e.target.value }))}
                    />
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                      <button
                        onClick={handleGenerate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50"
                        disabled={state.isLoading}
                      >
                        {state.isLoading ? 'Drafting...' : 'Magic Draft'}
                      </button>
                    </div>
                    {state.generatedContent && (
                      <div className="p-4 bg-blue-50 border-t border-blue-100 text-sm text-gray-800 whitespace-pre-wrap h-1/2 overflow-y-auto">
                        {state.generatedContent}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DOCS VIEW */}
              {state.activeApp === AppMode.DOCS && (
                <div className="bg-white h-full rounded-xl shadow-sm border border-gray-100 flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-gray-700">Untitled Document</span>
                    <button onClick={handleGenerate} className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-1 rounded-full transition-colors">
                      ✨ Help me write
                    </button>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto">
                    <textarea
                      className="w-full h-full outline-none resize-none text-gray-800 leading-relaxed p-2"
                      placeholder="Start typing or use Gemini to generate content..."
                      value={state.generatedContent || state.currentInput}
                      onChange={(e) => setState(prev => ({ ...prev, currentInput: e.target.value, generatedContent: '' }))}
                    />
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
                      placeholder="Gemini Prompt: e.g., 'Write a project proposal for VR integration'"
                      value={state.currentInput}
                      onChange={(e) => setState(prev => ({ ...prev, currentInput: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* CALENDAR VIEW */}
              {state.activeApp === AppMode.CALENDAR && (
                <div className="flex flex-col h-full gap-6">
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <div key={day} className={`min-w-[120px] p-4 rounded-xl border ${i === 2 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}>
                        <div className="text-sm font-bold opacity-70">{day}</div>
                        <div className="text-2xl font-bold mt-1">{14 + i}</div>
                        {i === 2 && <div className="mt-2 text-xs bg-white/20 px-2 py-1 rounded">Today</div>}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white flex-1 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 font-bold text-gray-700">Schedule</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {state.calendarEvents.map(event => (
                        <div key={event.id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                          <div className="text-gray-500 font-mono text-sm w-20 pt-1">{event.time}</div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{event.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add event: 'Lunch with Dave tomorrow at 1pm'"
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500"
                          value={state.currentInput}
                          onChange={(e) => setState(prev => ({ ...prev, currentInput: e.target.value }))}
                        />
                        <button
                          onClick={handleGenerate}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS VIEW */}
              {state.activeApp === AppMode.SETTINGS && (
                <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Room Customization</h2>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-600 mb-2">Brand Color</label>
                    <div className="flex gap-3">
                      {['#8899a6', '#E53935', '#43A047', '#1E88E5', '#FB8C00', '#8E24AA'].map(color => (
                        <button
                          key={color}
                          onClick={() => onUpdateConfig({ ...roomConfig, wallColor: color })}
                          className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${roomConfig.wallColor === color ? 'border-gray-800 shadow-md' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-600 mb-2">Logo URL</label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 transition-shadow"
                      value={roomConfig.logoUrl}
                      onChange={(e) => onUpdateConfig({ ...roomConfig, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-gray-400 mt-2">Enter a direct link to a transparent PNG for best results.</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg text-blue-800 text-sm">
                    Changes apply instantly to the immersive room environment.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};