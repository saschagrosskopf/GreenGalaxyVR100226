/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { Session, View, AuthResponse, Space, User } from './types';
import { api } from './services/api';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
// @ts-ignore
import { saveUserToFirestore, getUserFromFirestore, authenticateWithGoogle, getSessionId } from './logic';

// Components
import Sidebar from './components/Sidebar';
import GoogleSignIn from './components/GoogleSignIn';
import OnboardingWizard from './components/OnboardingWizard';
import CustomerJourney from './components/CustomerJourney';

// Views
import Dashboard from './components/views/Dashboard';
import Spaces from './components/views/Spaces';
import Assets from './components/views/Assets';
import IdeaGenerator from './components/views/IdeaGenerator';
import Devices from './components/views/Devices';
// Unity removed - using ThreeJS now
import Publish from './components/views/Publish';
import Profile from './components/views/Profile';
import Team from './components/views/Team';
import Brand from './components/views/Brand';
import OrgSettings from './components/views/OrgSettings';
import PlatformAdmin from './components/views/PlatformAdmin';
import XRPreview from './components/views/XRPreview';
import NexusHub from './components/views/NexusHub';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [previewSpace, setPreviewSpace] = useState<Space | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [onboardingProfile, setOnboardingProfile] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'up' | 'down'>('checking');

  // Check backend and Firebase Auth on mount
  useEffect(() => {
    checkBackend();
    // Listen for Firebase Auth state changes (replaces localStorage)
    try {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in via Firebase - restore session from Firestore
          console.log("🔥 Firebase Auth: User detected", firebaseUser.email);
          const userData = await getUserFromFirestore(firebaseUser.uid);
          if (userData) {
            setSession({
              token: await firebaseUser.getIdToken(),
              user: {
                id: userData.id || firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                name: userData.name || firebaseUser.displayName || 'GreenGalaxy User',
                picture: userData.picture || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=User&background=06B6D4&color=fff&size=128`,
                role: userData.role || 'OWNER',
                orgId: userData.orgId || 'org_def',
                hasCompletedOnboarding: true
              },
              org: {
                id: 'org_def',
                name: 'GreenGalaxy HQ',
                primaryColor: '#06B6D4',
                secondaryColor: '#1E293B',
                accentColor: '#F472B6',
                status: 'VERIFIED',
                domains: ['greengalaxy.tech'],
                isBrandVerified: true,
                plan: 'ENTERPRISE',
                subscriptionStatus: 'ACTIVE'
              }
            });
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Auth not initialized (check .env variables):", e);
    }
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/health`);
      if (res.ok) {
        setBackendStatus('up');
        console.log("🚀 Backend is reachable");
      } else {
        setBackendStatus('down');
      }
    } catch (e) {
      setBackendStatus('down');
      console.error("❌ Backend unreachable:", e);
    }
  };

  // Helper to decode Google JWT and extract user info
  const decodeGoogleJWT = (credential: string): { email: string; name: string; picture: string; sub: string } | null => {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return {
          email: payload.email || 'user@greengalaxy.tech',
          name: payload.name || payload.given_name || 'GreenGalaxy User',
          picture: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'User')}&background=06B6D4&color=fff&size=128`,
          sub: payload.sub || `user_${Date.now()}`
        };
      }
    } catch (e) {
      console.warn("Could not decode JWT:", e);
    }
    return null;
  };

  const handleGoogleSuccess = async (credential: string) => {
    console.log("🔐 Google credential received, processing login...");

    // Decode the Google JWT to get user info (always works, no Firebase dependency)
    const googleUser = decodeGoogleJWT(credential);

    if (!googleUser) {
      console.error("❌ Could not decode Google JWT, falling back to demo");
      handleDemoLogin();
      return;
    }

    console.log("✅ Google login:", googleUser.name, googleUser.email);

    const userFromGoogle = {
      id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      role: 'OWNER' as const,
      orgId: 'org_def',
      hasCompletedOnboarding: true
    };

    // Try Firebase Auth in background (non-blocking, with timeout)
    try {
      const fbPromise = authenticateWithGoogle(credential);
      await Promise.race([fbPromise, new Promise((_, r) => setTimeout(() => r('timeout'), 3000))]);
    } catch (e) {
      console.warn("⚠️ Firebase Auth skipped:", e);
    }

    // Try backend auth (non-blocking)
    try {
      const res: AuthResponse = await api.auth.google(credential);
      if (res.status === 'ok' && res.session) {
        setSession(res.session);
        await saveUserToFirestore(res.session.user).catch(() => { });
        return;
      }
    } catch (e) {
      console.warn("⚠️ Backend auth skipped:", e);
    }

    // Fallback — set session directly from Google JWT (always works)
    try { await saveUserToFirestore(userFromGoogle); } catch (e) { /* ok */ }

    setSession({
      token: credential,
      user: userFromGoogle,
      org: {
        id: 'org_def',
        name: 'GreenGalaxy HQ',
        primaryColor: '#06B6D4',
        secondaryColor: '#1E293B',
        accentColor: '#F472B6',
        status: 'VERIFIED',
        domains: ['greengalaxy.tech'],
        isBrandVerified: true,
        plan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE'
      }
    });
  };


  // Demo Bypass - ALWAYS works, perfect for investor pitch
  const handleDemoLogin = async () => {
    // Generate random guest identity
    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const guestName = `Guest ${randomId}`;
    const colors = ['06B6D4', '8B5CF6', 'F472B6', '22C55E', 'F59E0B'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    // Reverted to updated GLB URLs provided by user
    const avatarKeys = ['a1', 'a2', 'a3'];
    const randomAvatarKey = avatarKeys[Math.floor(Math.random() * avatarKeys.length)];

    const mockPayload = {
      email: `guest.${randomId}@greengalaxy.tech`,
      name: guestName,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=${randomColor}&color=fff&size=128`,
      sub: `demo_user_${Date.now()}_${randomId}`,
      avatar_key: randomAvatarKey
    };
    const encodedPayload = btoa(JSON.stringify(mockPayload));
    const mockToken = `mockHeader.${encodedPayload}.mockSignature`;

    // Direct bypass - do not even try backend for local demo
    // This ensures it works 100% of the time even if backend is down or not configured
    console.log("🧪 Guest Mode: Creating local session");

    const demoUser = {
      id: mockPayload.sub,
      email: mockPayload.email,
      name: mockPayload.name,
      picture: mockPayload.picture,
      role: 'OWNER' as const,
      orgId: 'org_def',
      avatarUrl: randomAvatarKey
    };

    // Try to save demo user to Firestore (non-blocking)
    saveUserToFirestore(demoUser).catch(() => { });

    setSession({
      token: mockToken,
      user: demoUser,
      org: {
        id: 'org_def',
        name: 'GreenGalaxy HQ',
        primaryColor: '#' + randomColor,
        secondaryColor: '#1E293B',
        accentColor: '#F472B6',
        status: 'VERIFIED',
        domains: ['greengalaxy.tech'],
        isBrandVerified: true,
        plan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE'
      }
    });
  };

  const handleLogout = async () => {
    // Sign out from Firebase Auth (no localStorage to clear!)
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log("🔥 Firebase signOut successful");
    } catch (e) {
      console.warn("Firebase signOut error:", e);
    }
    setSession(null);
    setOnboardingProfile(null);
    setView(View.DASHBOARD);
  };

  const handlePreviewSpace = (space: Space) => {
    setPreviewSpace(space);
    setView(View.XR_PREVIEW);
  };

  const handleProfileUpdate = (updates: Partial<User>) => {
    if (session) {
      setSession({
        ...session,
        user: { ...session.user, ...updates }
      });
    }
  };

  // 1. Not Logged In
  if (!session && !onboardingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gg-navy relative overflow-hidden p-4">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80')] bg-cover opacity-10 blur-sm pointer-events-none"></div>
        <div className="absolute w-96 h-96 bg-gg-purple/20 rounded-full blur-3xl -top-20 -left-20"></div>
        <div className="absolute w-96 h-96 bg-gg-cyan/20 rounded-full blur-3xl bottom-0 right-0"></div>

        <div className="relative z-10 bg-gg-navy-secondary/90 backdrop-blur-md p-8 md:p-10 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gg-cyan to-gg-purple mb-2">
              GreenGalaxy
            </h1>
            <p className="text-gray-300">Enterprise VR Workspace Platform</p>
            {backendStatus === 'down' && (
              <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs animate-pulse">
                ⚠️ Backend Offline: Please check your terminal
              </div>
            )}
          </div>

          <div className="space-y-6">
            <p className="text-sm text-gray-400">Sign in with your corporate account to access your VR spaces.</p>

            <div className="flex justify-center w-full overflow-hidden min-h-[50px]">
              <GoogleSignIn onSuccess={handleGoogleSuccess} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gg-navy-secondary text-gray-500">Development Access</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2 rounded-lg border border-gray-600 transition flex items-center justify-center gap-2"
            >
              <span>🧪</span> Continue as Guest
            </button>

          </div>
        </div>
      </div>
    );
  }

  // 2. Onboarding
  if (!session && onboardingProfile) {
    return <OnboardingWizard googleProfile={onboardingProfile} onComplete={(sess) => setSession(sess)} />;
  }

  // 3. Main App
  if (session) {
    // Check if new customer journey is completed
    if (!session.user.hasCompletedOnboarding) {
      return (
        <CustomerJourney
          session={session}
          onComplete={(updatedSession) => setSession(updatedSession)}
        />
      );
    }

    return (
      <div className="flex min-h-screen bg-gg-navy">

        {currentView !== View.XR_PREVIEW && (
          <Sidebar
            currentView={currentView}
            setView={setView}
            user={session.user}
            onLogout={handleLogout}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={`flex-1 flex flex-col ${currentView === View.XR_PREVIEW ? 'w-full h-screen' : 'md:ml-64 h-screen'}`}>

          {currentView !== View.XR_PREVIEW && (
            <div className="md:hidden flex items-center justify-between p-4 bg-gg-navy border-b border-gray-700 sticky top-0 z-30">
              <div className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-gg-cyan to-gg-purple">
                GreenGalaxy
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>
          )}

          <main className={`${currentView === View.XR_PREVIEW ? 'w-full h-full' : 'flex-1 p-4 md:p-8 overflow-y-auto'}`}>
            {currentView === View.DASHBOARD && <Dashboard user={session.user} setView={setView} />}
            {currentView === View.SPACES && <Spaces setView={setView} onPreview={handlePreviewSpace} orgId={session.org.id} />}
            {currentView === View.ASSETS && <Assets session={session} setView={setView} />}
            {currentView === View.IDEAS && <IdeaGenerator user={session.user} setView={setView} onPreview={handlePreviewSpace} />}
            {currentView === View.NEXUS_HUB && <NexusHub />}
            {currentView === View.DEVICES && <Devices />}

            {currentView === View.PUBLISH && <Publish user={session.user} />}
            {currentView === View.PROFILE && <Profile user={session.user} onUpdateProfile={handleProfileUpdate} />}
            {currentView === View.TEAM && <Team currentUser={session.user} setView={setView} />}
            {currentView === View.BRAND && <Brand onUpdate={() => { }} orgId={session.org.id} />}
            {currentView === View.ORG_SETTINGS && <OrgSettings orgId={session.org.id} />}
            {currentView === View.PLATFORM_ADMIN && <PlatformAdmin />}

            {currentView === View.XR_PREVIEW && previewSpace && (
              <XRPreview
                key={previewSpace.id}
                space={previewSpace}
                org={session?.org}
                user={session?.user || null}
                onExit={() => setView(View.SPACES)}
                onUpdateUser={handleProfileUpdate}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  return <div>Error State</div>;
};

export default App;