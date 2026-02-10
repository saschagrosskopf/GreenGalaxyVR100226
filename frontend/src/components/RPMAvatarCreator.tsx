import React, { useEffect, useRef } from 'react';

interface RPMAvatarCreatorProps {
    onAvatarExported: (avatarUrl: string) => void;
    onClose: () => void;
}

const RPMAvatarCreator: React.FC<RPMAvatarCreatorProps> = ({ onAvatarExported, onClose }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const subdomain = 'greengalaxy'; // Replace with your RPM subdomain if you have one

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const url = event.data;

            // Ready Player Me sends the avatar URL as a string in the message data
            // For the v1 integration, it looks like this:
            if (typeof url === 'string' && url.includes('.glb')) {
                onAvatarExported(url);
            }

            // Newer v2 integration uses JSON objects
            try {
                const json = JSON.parse(event.data);
                if (json.source === 'readyplayerme' && json.eventName === 'v1.avatar.exported') {
                    onAvatarExported(json.data.url);
                }
            } catch (e) {
                // Not a JSON message, ignore
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onAvatarExported]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-gg-navy border border-gray-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-gg-cyan">🧍</span> Forge Your Immersion Avatar
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 bg-gg-navy-secondary relative">
                    <iframe
                        ref={iframeRef}
                        src={`https://${subdomain}.readyplayer.me/avatar?frameApi`}
                        className="w-full h-full border-none"
                        allow="camera; microphone; clipboard-write"
                    />

                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-gg-navy to-transparent pointer-events-none">
                        <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">
                            Powered by Ready Player Me
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RPMAvatarCreator;
