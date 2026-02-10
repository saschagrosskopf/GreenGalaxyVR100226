import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    handleGoogleCredential: (response: any) => void;
  }
}

interface GoogleSignInProps {
  onSuccess: (credential: string) => void;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess }) => {
  const btnDivRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Set global callback so it's always reachable
    window.handleGoogleCredential = (response: any) => {
      console.log("✅ Google credential received via callback");
      if (response.credential) {
        onSuccess(response.credential);
      }
    };

    let interval: any;

    const initializeGSI = () => {
      if (!window.google?.accounts?.id) return;
      if (!btnDivRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: window.handleGoogleCredential,
          ux_mode: 'popup',
        });

        window.google.accounts.id.renderButton(btnDivRef.current, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'rectangular',
          width: 280,
        });

        setLoaded(true);
        if (interval) clearInterval(interval);
        console.log("🔐 Google Sign-In button rendered");
      } catch (e) {
        console.error("GSI init error:", e);
      }
    };

    if (window.google?.accounts?.id) {
      initializeGSI();
    } else {
      interval = setInterval(initializeGSI, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onSuccess]);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[50px]">
      <div id="google-btn-wrapper" ref={btnDivRef} className={!loaded ? 'hidden' : ''} />
      {!loaded && (
        <div className="flex items-center space-x-2 text-gray-400 text-sm animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-t-gg-cyan border-gray-600 animate-spin"></div>
          <span>Connecting to Google Security...</span>
        </div>
      )}
    </div>
  );
};

export default GoogleSignIn;