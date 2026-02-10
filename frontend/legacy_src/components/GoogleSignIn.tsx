
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleSignInProps {
  onSuccess: (credential: string) => void;
}

// Fix: The component was truncated, returning void. Restored JSX return to satisfy React.FC type.
const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess }) => {
  const btnDivRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let interval: any;

    const initializeGSI = () => {
      if (window.google && btnDivRef.current) {
        // DEBUG: Print the exact origin to help fix 400 origin_mismatch errors
        console.log("🔒 [GoogleAuth] CONFIG CHECK:");
        console.log("   YOUR CLIENT ID: 651396338-nhqjsa2g105vqolr6fssl6urnfup8dmf.apps.googleusercontent.com");
        console.log("   YOUR ORIGIN:    " + window.location.origin);
        console.log("   ACTION: Ensure the origin above is added to 'Authorized JavaScript origins' in GCP Console.");

        try {
          window.google.accounts.id.initialize({
            client_id: '651396338-nhqjsa2g105vqolr6fssl6urnfup8dmf.apps.googleusercontent.com',
            callback: (response: any) => {
              console.log("Google Auth Success");
              onSuccess(response.credential);
            },
            cancel_on_tap_outside: false,
            // Enable detailed logging in development
            prompt_parent_id: btnDivRef.current.id,
            itp_support: true
          });
          
          window.google.accounts.id.renderButton(btnDivRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 280
          });

          setLoaded(true);
          if (interval) clearInterval(interval);
        } catch (e) {
          console.error("Google Sign-In initialization error:", e);
        }
      }
    };

    if (window.google) {
      initializeGSI();
    } else {
      // Poll every 500ms for the script
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
