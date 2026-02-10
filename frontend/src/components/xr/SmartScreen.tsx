import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { processAppRequest } from '../../services/gemini';
import { AppMode, WorkspaceState } from '../../types';

interface SmartScreenProps {
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number];
    mode: AppMode;
    accentColor: string;
    title: string;
    contentUrl?: string;
    modelName?: string;
    onUpdateContent?: (url: string) => void;
}

export const SmartScreen: React.FC<SmartScreenProps> = ({ position, rotation, size, mode, accentColor, title, contentUrl, modelName, onUpdateContent }) => {
    const [state, setState] = useState<WorkspaceState>({
        currentInput: '',
        generatedContent: '',
        isLoading: false,
        activeApp: mode,
        emails: [],
        calendarEvents: [
            { id: 1, title: 'Q4 All Hands - Global', time: '09:00' },
            { id: 2, title: 'Product Launch Prep', time: '11:00' },
            { id: 3, title: 'Investor Relations Sync', time: '14:00' },
            { id: 4, title: 'Design System Review', time: '16:30' },
        ]
    });

    // Rich Demo Data for Spreadsheet
    const [sheetData, setSheetData] = useState<string[][]>([
        ['Metric', 'Target Q4', 'Actual', 'Growth'],
        ['ARR', '$2.5M', '$2.8M', '+12%'],
        ['User Churn', '< 2%', '1.8%', '-0.2%'],
        ['NPS Score', '50+', '62', '+24%'],
        ['Server Uptime', '99.99%', '100%', '0.0%'],
        ['VR Sessions', '5,000', '8,420', '+68%']
    ]);

    const [editUrl, setEditUrl] = useState(contentUrl || '');

    // Expose data for Smart Capture
    React.useEffect(() => {
        if (!(window as any).dashboards) (window as any).dashboards = {};
        (window as any).dashboards[title] = {
            mode,
            sheetData,
            generatedContent: state.generatedContent,
            notes: state.currentInput
        };
    }, [sheetData, state.generatedContent, state.currentInput, title, mode]);

    const isUrl = (str: string) => {
        try { return str.startsWith('http') || str.includes('.com') || str.includes('.org'); } catch (e) { return false; }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        // Premium Google Workspace Embed Strategy
        if (url.includes('docs.google.com')) {
            // Document
            if (url.includes('/document/d/')) {
                if (url.includes('/edit')) return url.replace('/edit', '/preview');
                return url + (url.includes('?') ? '&' : '?') + 'rm=minimal';
            }
            // Spreadsheet
            if (url.includes('/spreadsheets/d/')) {
                if (url.includes('/edit')) return url.replace('/edit', '/preview');
                return url + (url.includes('?') ? '&' : '?') + 'widget=true&headers=false';
            }
            // Presentation
            if (url.includes('/presentation/d/')) {
                if (url.includes('/edit')) return url.replace('/edit', '/embed?start=false&loop=false&delayms=3000');
                if (!url.includes('/embed')) return url.split('/edit')[0] + '/embed';
            }

            if (!url.includes('embedded=true')) return url + (url.includes('?') ? '&' : '?') + 'embedded=true';
        }
        return url;
    };

    const handleAI = async (action: string) => {
        setState(prev => ({ ...prev, isLoading: true }));
        let prompt = action === 'Analyze' ? `ANALYZE: ${state.currentInput}`
            : action === 'Ideate' ? `IDEATE: ${state.currentInput}`
                : `REFINE: ${state.currentInput}`;

        const content = await processAppRequest(mode, prompt, modelName);

        if (mode === AppMode.DOCS) {
            const rows = content.split('\n').map(row => row.split(','));
            if (rows.length > 1) {
                setSheetData(rows);
            }
            setState(prev => ({ ...prev, isLoading: false }));
        } else {
            setState(prev => ({ ...prev, isLoading: false, generatedContent: content }));
        }
    };

    const updateCell = (rowIndex: number, colIndex: number, val: string) => {
        const newData = [...sheetData];
        newData[rowIndex][colIndex] = val;
        setSheetData(newData);
    };

    return (
        <group position={position} rotation={rotation}>
            {/* 1. Backing Plate */}
            <mesh position={[0, 0, -0.1]}>
                <boxGeometry args={[size[0] + 0.2, size[1] + 0.2, 0.1]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* 2. Neon Rim */}
            <mesh position={[0, 0, -0.05]}>
                <boxGeometry args={[size[0] + 0.25, size[1] + 0.25, 0.05]} />
                <meshStandardMaterial emissive={accentColor} emissiveIntensity={1.5} color={accentColor} />
            </mesh>

            {/* 3. Screen Surface */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[size[0], size[1]]} />
                <meshBasicMaterial color="#000000" />
            </mesh>

            {/* 4. HTML Interface */}
            <Html
                transform
                position={[0, 0, 0.1]}
                style={{
                    width: `${size[0] * 100}px`,
                    height: `${size[1] * 100}px`,
                    userSelect: 'none'
                }}
                distanceFactor={3}
            >
                <div
                    className="w-full h-full flex flex-col overflow-hidden bg-gray-900 border border-white/10 text-white shadow-2xl rounded-sm font-sans"
                    style={{
                        boxShadow: `0 0 50px ${accentColor}20`,
                        backfaceVisibility: 'hidden'
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-2 border-b border-white/5" style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)' }}>
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }}></div>
                            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400 whitespace-nowrap">{title} // SYSTEM_ACTIVE</span>
                            <div className="ml-4 flex-1 max-w-md bg-white/5 rounded-full px-4 py-1 flex items-center border border-white/10">
                                <span className="text-[9px] text-gray-500 mr-3 uppercase font-bold">Secure Access</span>
                                <input
                                    className="bg-transparent border-none outline-none text-[10px] text-gray-300 w-full placeholder-gray-700"
                                    placeholder="Enter Workspace URL..."
                                    value={editUrl}
                                    onChange={e => setEditUrl(e.target.value)}
                                    onBlur={() => onUpdateContent?.(editUrl)}
                                    onKeyDown={e => e.key === 'Enter' && onUpdateContent?.(editUrl)}
                                />
                            </div>
                        </div>
                        {state.isLoading && <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Processing Request</span>
                        </div>}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-hidden relative bg-gray-900">
                        {isUrl(contentUrl || '') ? (
                            <iframe
                                src={getEmbedUrl(contentUrl!)}
                                className="w-full h-full border-none bg-white"
                                title="Content View"
                            />
                        ) : (
                            <>
                                {/* CALENDAR MODE */}
                                {mode === AppMode.CALENDAR && (
                                    <div className="p-6 h-full overflow-y-auto">
                                        <div className="flex justify-between items-end mb-6">
                                            <div className="text-4xl font-light text-white">Today</div>
                                            <div className="text-gray-400 text-sm">Oct 26, 2025</div>
                                        </div>
                                        <div className="space-y-3">
                                            {state.calendarEvents.map((evt) => (
                                                <div key={evt.id} className="flex gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition border-l-4" style={{ borderColor: accentColor }}>
                                                    <div className="text-gray-400 font-mono w-16 pt-1">{evt.time}</div>
                                                    <div className="font-medium text-lg">{evt.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SPREADSHEET MODE (DOCS) */}
                                {mode === AppMode.DOCS && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-black/40">
                                            <div className="flex-1 bg-white/10 rounded px-2 py-1 flex items-center">
                                                <span className="text-xs text-gray-400 mr-2">AI</span>
                                                <input
                                                    className="bg-transparent border-none outline-none text-sm text-white w-full"
                                                    placeholder='Ask Gemini: "Project Q1 revenue growth..."'
                                                    value={state.currentInput}
                                                    onChange={e => setState(p => ({ ...p, currentInput: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && handleAI('Ideate')}
                                                />
                                            </div>
                                            <button onClick={() => handleAI('Ideate')} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-bold">GENERATE</button>
                                        </div>
                                        <div className="flex-1 overflow-auto p-4">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        {sheetData[0].map((header, i) => (
                                                            <th key={i} className="border border-gray-700 bg-gray-800 p-2 text-left text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[100px]">
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sheetData.slice(1).map((row, rIndex) => (
                                                        <tr key={rIndex}>
                                                            {row.map((cell, cIndex) => (
                                                                <td key={cIndex} className="border border-gray-700 p-0">
                                                                    <input
                                                                        className="w-full bg-transparent p-2 text-sm text-white outline-none focus:bg-blue-900/30"
                                                                        value={cell}
                                                                        onChange={(e) => updateCell(rIndex + 1, cIndex, e.target.value)}
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* DASHBOARD MODE */}
                                {mode === AppMode.DASHBOARD && (
                                    <div className="h-full flex flex-col p-6">
                                        <div className="mb-4">
                                            <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2">Strategy & Notes</h3>
                                            <textarea
                                                className="w-full h-40 bg-black/20 border border-white/10 rounded p-3 text-lg font-light text-gray-100 placeholder-gray-600 outline-none resize-none"
                                                placeholder="Brainstorm ideas or type 'Analyze' to use AI..."
                                                value={state.generatedContent || state.currentInput}
                                                onChange={(e) => setState(p => ({ ...p, currentInput: e.target.value, generatedContent: '' }))}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mt-auto">
                                            {['Analyze', 'Ideate', 'Refine'].map(action => (
                                                <button
                                                    key={action}
                                                    onClick={() => handleAI(action)}
                                                    className="py-3 px-4 rounded bg-white/5 hover:bg-white/20 transition text-sm font-bold border border-white/10 hover:border-white/40 flex items-center justify-center gap-2"
                                                >
                                                    <span>✨</span> {action}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Html>
        </group>
    );
};