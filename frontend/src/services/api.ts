
import { User, Organization, Space, Session, Asset, Idea, Device, AuthResponse, View, TranscriptionItem, SessionSnapshot, SessionReport, SceneObject } from '../types';
// @ts-ignore
import { storage, db } from '../logic';
// @ts-ignore
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// @ts-ignore
import { collection, getDocs, getDoc, doc, setDoc, onSnapshot, query, where, writeBatch, deleteDoc, addDoc, serverTimestamp, orderBy, DocumentData } from 'firebase/firestore';
// import { GoogleGenAI, Type } from "@google/genai"; // Moved to Backend
/// <reference types="vite/client" />
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export const CURRENT_TEMPLATE_VERSION = 10;
// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = async (method: string, path: string) => {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  console.log(`🌐 [API] ${method} ${path}`);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface WorkspaceAsset {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'slide' | 'calendar' | 'dashboard';
  url: string;
  icon: string;
}

const GOOGLE_WORKSPACE_SAMPLES: WorkspaceAsset[] = [
  { id: 'gw1', name: 'Q4 Product Strategy', type: 'doc', url: 'https://docs.google.com/document/d/1X5W7V8zLp-F7b1q2A3R4K5L6M7N8O9P', icon: '📄' },
  { id: 'gw2', name: 'Global Revenue Ledger', type: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1yD_R_S-T-U-V-W-X-Y-Z', icon: '📊' },
  { id: 'gw3', name: 'VR Platform Pitch Deck', type: 'slide', url: 'https://docs.google.com/presentation/d/1presentation-id', icon: '📽️' },
  { id: 'gw4', name: 'Product Engineering Roadmap', type: 'doc', url: 'https://docs.google.com/document/d/1roadmap-id', icon: '📄' },
  { id: 'gw5', name: 'Marketing Campaign KPIs', type: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1kpi-id', icon: '📈' }
];

// SceneObject interface moved to types.ts

export interface WorkshopTemplate {
  id: string;
  name: string;
  objects: SceneObject[];
}

export const WORKSHOP_TEMPLATES: WorkshopTemplate[] = [
  {
    id: 'template_boardroom',
    name: 'Executive Boardroom',
    objects: [
      { type: 'screen', title: 'MASTER_KPI', pos: { x: 0, y: 3.5, z: -9 }, size: { w: 12, h: 6.5 }, color: '#1e293b', content: 'DASHBOARD' },
      { type: 'screen', title: 'Q4_REVENUE', pos: { x: -10, y: 3.2, z: 0 }, size: { w: 7, h: 4.5 }, rot: { x: 0, y: 90, z: 0 }, color: '#0984e3', content: 'DOCS' },
      { type: 'screen', title: 'GLOBAL_SCHED', pos: { x: 10, y: 3.2, z: 0 }, size: { w: 7, h: 4.5 }, rot: { x: 0, y: -90, z: 0 }, color: '#00b894', content: 'CALENDAR' },
      { type: 'screen', title: 'AI_REPORTS', pos: { x: 0, y: 3.5, z: 9 }, size: { w: 9, h: 5.5 }, rot: { x: 0, y: 180, z: 0 }, color: '#6c5ce7', content: 'DASHBOARD' }
    ]
  },
  {
    id: 'template_whiteboard',
    name: 'Infinite Canvas Studio',
    objects: [
      { type: 'screen', title: 'MAIN_CANVAS', pos: { x: 0, y: 5, z: -18 }, size: { w: 14, h: 8 }, color: '#0ea5e9', content: 'DASHBOARD' },
      { type: 'screen', title: 'REFERENCE', pos: { x: -18, y: 4, z: 0 }, size: { w: 10, h: 6 }, rot: { x: 0, y: 90, z: 0 }, color: '#8b5cf6', content: 'DOCS' },
      { type: 'screen', title: 'TIMELINE', pos: { x: 18, y: 4, z: 0 }, size: { w: 10, h: 6 }, rot: { x: 0, y: -90, z: 0 }, color: '#22c55e', content: 'CALENDAR' },
      { type: 'screen', title: 'COLLABORATION', pos: { x: 0, y: 4, z: 18 }, size: { w: 10, h: 6 }, rot: { x: 0, y: 180, z: 0 }, color: '#f59e0b', content: 'DASHBOARD' }
    ]
  },
  {
    id: 'template_studio',
    name: 'Creative Command Center',
    objects: [
      { type: 'screen', title: 'MAIN_TERMINAL', pos: { x: 0, y: 3.5, z: -8 }, size: { w: 10, h: 5.5 }, color: '#a855f7', content: 'DASHBOARD' },
      { type: 'screen', title: 'CREATIVE_HUB', pos: { x: -12, y: 3, z: 0 }, size: { w: 6, h: 4 }, rot: { x: 0, y: 90, z: 0 }, color: '#ec4899', content: 'DOCS' },
      { type: 'screen', title: 'COLLAB_STREAM', pos: { x: 12, y: 3, z: 0 }, size: { w: 6, h: 4 }, rot: { x: 0, y: -90, z: 0 }, color: '#8b5cf6', content: 'CALENDAR' }
    ]
  },
  {
    id: 'template_zen',
    name: 'Focus & Meditation Lab',
    objects: [
      { type: 'screen', title: 'ZEN_FOCUS', pos: { x: 0, y: 3, z: -7 }, size: { w: 5, h: 3 }, color: '#22c55e', content: 'DASHBOARD' }
    ]
  },
  {
    id: 'template_expo',
    name: 'Presentation Hall',
    objects: [
      { type: 'screen', title: 'MAIN_STAGE', pos: { x: 0, y: 4.5, z: -12 }, size: { w: 16, h: 9 }, color: '#06b6d4', content: 'DASHBOARD' },
      { type: 'screen', title: 'AUDIENCE_FEED', pos: { x: 0, y: 3.5, z: 10 }, size: { w: 8, h: 4.5 }, rot: { x: 0, y: 180, z: 0 }, color: '#64748b', content: 'DASHBOARD' }
    ]
  },
  {
    id: 'template_command',
    name: 'Tactical Operations Center',
    objects: [
      { type: 'screen', title: 'COMMAND_OVERVIEW', pos: { x: 0, y: 4.5, z: -11.5 }, size: { w: 12, h: 6.5 }, color: '#ef4444', content: 'DASHBOARD' },
      { type: 'screen', title: 'INTEL_FEED', pos: { x: -14, y: 3.5, z: 0 }, size: { w: 8, h: 4.5 }, rot: { x: 0, y: 90, z: 0 }, color: '#3b82f6', content: 'DOCS' },
      { type: 'screen', title: 'TACTICAL_NET', pos: { x: 14, y: 3.5, z: 0 }, size: { w: 8, h: 4.5 }, rot: { x: 0, y: -90, z: 0 }, color: '#f59e0b', content: 'CALENDAR' }
    ]
  }
];

const SEED_USER: User = {
  id: 'admin',
  email: 'admin@greengalaxy.tech',
  name: 'Lead Engineer',
  picture: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
  role: 'OWNER',
  orgId: 'org_def'
};

export const api = {
  auth: {
    google: async (credential: string): Promise<AuthResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: credential })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Authentication failed');
        }

        const data = await response.json();

        // 🔄 MERGE FIRESTORE PROFILE (Avatar Persistence)
        // The backend returns Google info, but we save custom avatar selection to Firestore.
        try {
          // @ts-ignore
          const userRef = doc(db, 'users', data.user.id);
          // @ts-ignore
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const firestoreData = userSnap.data();
            console.log('🔄 Merged persistent profile:', firestoreData);
            data.user = {
              ...data.user,
              ...firestoreData,
              // Ensure ID is preserved from backend
              id: data.user.id
            };
          }
        } catch (e) {
          console.warn("⚠️ Failed to merge Firestore profile:", e);
        }

        // 🔐 SIGN IN TO FIREBASE FRONTEND (Required for Firestore writes like updateProfile)
        try {
          const auth = getAuth();
          const cred = GoogleAuthProvider.credential(credential);
          await signInWithCredential(auth, cred);
          console.log("✅ Firebase Frontend Sign-In Success:", auth.currentUser?.uid);
        } catch (fbError) {
          console.warn("⚠️ Firebase Frontend Sign-In Warning (Avatar saving may not work):", fbError);
        }

        return data;
      } catch (e) {
        console.error("Backend Auth Error:", e);
        throw e;
      }
    },
    register: async (data: any): Promise<Session> => ({
      token: 'mock_token',
      user: SEED_USER,
      org: { id: 'org_def', name: data.orgName, primaryColor: '#06B6D4', secondaryColor: '#1E293B', accentColor: '#F472B6', status: 'PENDING', domains: [], isBrandVerified: false, plan: 'FREE', subscriptionStatus: 'NONE' }
    })
  },
  assets: {
    list: async (): Promise<Asset[]> => {
      try {
        const s = await getDocs(collection(db, 'assets'));
        return s.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Asset[];
      } catch (e) {
        console.error("Firebase Assets Error:", e);
        return [];
      }
    },
    upload: async (file: File): Promise<Asset> => {
      try {
        const storageRef = ref(storage, 'assets/' + Date.now() + '_' + file.name);
        const snapshot = await uploadBytesResumable(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        const asset: Asset = {
          id: 'asset_' + Date.now(),
          name: file.name,
          type: /\.(glb|gltf)$/i.test(file.name) ? 'model' : 'image',
          url,
          size: file.size,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'assets', asset.id), { ...asset, createdAt: serverTimestamp() });
        return asset;
      } catch (e) { throw e; }
    },
    delete: async (id: string) => { await deleteDoc(doc(db, 'assets', id)); }
  },
  spaces: {
    getWorkshopTemplates: () => WORKSHOP_TEMPLATES,
    list: async (orgId?: string): Promise<Space[]> => {
      try {
        // Simplified query without composite index requirement
        // Fetch all spaces and filter/sort client-side to avoid Firestore index issues
        let spaces: Space[] = [];

        if (orgId) {
          // Try simple where query first (no orderBy to avoid composite index)
          try {
            const q = query(collection(db, 'spaces'), where('orgId', '==', orgId));
            const s = await getDocs(q);
            spaces = s.docs.map(d => ({ id: d.id, ...d.data() })) as Space[];
          } catch (indexError) {
            // Fallback: fetch all and filter client-side
            console.warn("Query failed, falling back to client-side filter:", indexError);
            const allSpaces = await getDocs(collection(db, 'spaces'));
            spaces = allSpaces.docs
              .map(d => ({ id: d.id, ...d.data() }) as Space)
              .filter(s => s.orgId === orgId);
          }
        } else {
          const allSpaces = await getDocs(collection(db, 'spaces'));
          spaces = allSpaces.docs.map(d => ({ id: d.id, ...d.data() })) as Space[];
        }

        // Sort client-side by updatedAt (newest first)
        return spaces.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      } catch (e) {
        console.error("Firestore Spaces Error:", e);
        return [];
      }
    },
    create: async (space: Space, variantId?: string): Promise<Space> => {
      const docRef = doc(db, 'spaces', space.id);
      await setDoc(docRef, { ...space, updatedAt: new Date().toISOString() });
      if (variantId || space.templateId) await api.spaces.hydrateSpace(space.id, variantId || space.templateId);
      return space;
    },
    // Create custom space from GLB assets and add them as scene objects
    createCustom: async (name: string, assets: Asset[], orgId?: string): Promise<Space> => {
      const newSpace: Space = {
        id: 'custom_' + Date.now(),
        name: name || 'Custom VR Space',
        customAssets: assets,
        templateId: 'custom',
        status: 'ready',
        thumbnailUrl: assets.find(a => a.type === 'image')?.url || 'https://placehold.co/600x400?text=Custom+Space',
        updatedAt: new Date().toISOString(),
        orgId: orgId || 'org_def'
      };

      // Save space to Firestore
      await setDoc(doc(db, 'spaces', newSpace.id), newSpace);

      // CRITICAL: Immediately hydrate with GLB assets as scene objects
      // This ensures they appear when entering VR
      const modelAssets = assets.filter(a => a.type === 'model' || /\.(glb|gltf)$/i.test(a.name));
      if (modelAssets.length > 0) {
        console.log(`🏗️ Hydrating custom space with ${modelAssets.length} GLB models...`);
        const batchAdd = writeBatch(db);

        // Arrange models in a grid layout
        modelAssets.forEach((asset, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const x = (col - 1) * 4; // Spread horizontally: -4, 0, 4
          const z = row * -5; // Spread backwards: 0, -5, -10

          const objectRef = doc(collection(db, 'spaces', newSpace.id, 'sceneObjects'));
          batchAdd.set(objectRef, {
            id: objectRef.id,
            type: 'model',
            url: asset.url,
            title: asset.name,
            pos: { x, y: 0, z },
            rot: { x: 0, y: 0, z: 0 },
            version: CURRENT_TEMPLATE_VERSION,
            createdAt: serverTimestamp()
          });
        });

        // Add a main screen for context
        const screenRef = doc(collection(db, 'spaces', newSpace.id, 'sceneObjects'));
        batchAdd.set(screenRef, {
          id: screenRef.id,
          type: 'screen',
          title: 'ASSET_GALLERY',
          pos: { x: 0, y: 3.5, z: -9 },
          size: { w: 10, h: 5 },
          color: '#1e293b',
          content: 'DASHBOARD',
          version: CURRENT_TEMPLATE_VERSION,
          createdAt: serverTimestamp()
        });

        await batchAdd.commit();
        console.log(`✅ Custom space hydrated with ${modelAssets.length} models`);
      }

      return newSpace;
    },
    hydrateSpace: async (spaceId: string, templateId: string) => {
      const template = WORKSHOP_TEMPLATES.find(t => t.id === templateId) || WORKSHOP_TEMPLATES[0];
      const q = query(collection(db, 'spaces', spaceId, 'sceneObjects'));
      const s = await getDocs(q);
      const batch = writeBatch(db);
      s.forEach(d => batch.delete(d.ref));
      await batch.commit();

      const batchAdd = writeBatch(db);
      template.objects.forEach(obj => {
        const objectRef = doc(collection(db, 'spaces', spaceId, 'sceneObjects'));
        batchAdd.set(objectRef, {
          ...obj, id: objectRef.id, version: CURRENT_TEMPLATE_VERSION,
          createdAt: serverTimestamp(),
          size: { w: obj.size?.w ?? 1, h: obj.size?.h ?? 1, d: obj.size?.d ?? 1, r: obj.size?.r ?? 0.5 }
        });
      });
      await batchAdd.commit();
    },
    attachIdea: async (spaceId: string, ideaId: string) => {
      // Mock implementation for attaching AI ideas to spaces
      console.log(`Idea ${ideaId} attached to space ${spaceId}`);
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, 'spaces', id));
    }
  },
  scenes: {
    addSceneObject: async (sid: string, d: any) => {
      return await addDoc(collection(db, 'spaces', sid, 'sceneObjects'), {
        ...d, createdAt: serverTimestamp(), version: CURRENT_TEMPLATE_VERSION
      });
    },
    updateObject: async (sid: string, oid: string, d: any) => {
      return await setDoc(doc(db, 'spaces', sid, 'sceneObjects', oid), d, { merge: true });
    }
  },
  multiplayer: {
    updatePosition: async (id: string, data: any) => {
      try { await setDoc(doc(db, 'players', id), { ...data, lastSeen: Date.now() }, { merge: true }); } catch (e) { }
    },
    removeUser: async (id: string) => {
      try { await deleteDoc(doc(db, 'players', id)); } catch (e) { }
    },
    adminPurgeGhosts: async (myId?: string) => {
      const s = await getDocs(query(collection(db, 'players')));
      s.forEach(d => { if (!myId || d.id !== myId) deleteDoc(d.ref); });
    }
  },
  devices: {
    pairingCode: async () => ({ code: 'GG-' + Math.floor(1000 + Math.random() * 9000) }),
    list: async (): Promise<Device[]> => [{ id: 'd1', name: 'Meta Quest 3', status: 'online', lastSeen: 'Just now' }]
  },
  org: {
    get: async (id: string): Promise<Organization> => ({
      id, name: 'GreenGalaxy HQ', primaryColor: '#06B6D4', secondaryColor: '#1E293B', accentColor: '#F472B6',
      status: 'VERIFIED', domains: ['greengalaxy.tech'], isBrandVerified: true, plan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE', furnitureMap: {}
    }),
    updateBranding: async (data: Organization) => { },
    update: async (id: string, data: Partial<Organization>) => { }
  },
  team: {
    list: async (): Promise<User[]> => [SEED_USER],
    invite: async (emails: string[]) => { },
    updateProfile: async (data: { displayName?: string; avatarUrl?: string; hasCompletedOnboarding?: boolean }) => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.warn("⚠️ Update profile failed: No Firebase Auth User (are you signed in via Google credential?).");
        return;
      }

      const userRef = doc(db, 'users', user.uid);

      const payload: any = { updatedAt: serverTimestamp() };
      if (data.displayName) payload.name = data.displayName;
      if (data.avatarUrl) payload.avatarUrl = data.avatarUrl;
      if (data.hasCompletedOnboarding !== undefined) payload.hasCompletedOnboarding = data.hasCompletedOnboarding;

      await setDoc(userRef, payload, { merge: true });

      console.log(`✅ Profile persisted for ${user.uid}:`, payload);
    }
  },
  ideas: {
    generate: async (prompt: string): Promise<Idea> => ({
      id: 'idea_' + Date.now(), prompt, description: 'Spatial layout for ' + prompt,
      suggestedProps: ['Whiteboard', 'Screens'], layoutHints: 'Open floor plan',
      createdAt: new Date().toISOString()
    })
  },
  platform: {
    listUsers: async (): Promise<User[]> => [SEED_USER],
    verifyOrg: async (id: string) => { },
    rejectOrg: async (id: string) => { }
  },
  ai: {
    generateWorkshopLayout: async (topic: string, modelName: string = "gemini-1.5-pro"): Promise<SceneObject[]> => {
      try {
        const headers = await getAuthHeaders('POST', '/api/ai/generate-layout');
        const response = await fetch(`${API_BASE_URL}/api/ai/generate-layout`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ topic, model_name: modelName })
        });

        if (!response.ok) return [];

        return await response.json();
      } catch (e) {
        console.error("AI Generation Error:", e);
        return [];
      }
    }
  },
  workspace: {
    listRecent: async (): Promise<WorkspaceAsset[]> => {
      // In a production environment, this would call the Google Drive API
      // For now, we return a curated list of sample assets
      return GOOGLE_WORKSPACE_SAMPLES;
    },
    getAssetById: (id: string) => GOOGLE_WORKSPACE_SAMPLES.find(a => a.id === id)
  },
  sessions: {
    capture: async (snapshot: Omit<SessionSnapshot, 'id'>): Promise<SessionSnapshot> => {
      const id = 'snap_' + Date.now();
      const finalSnapshot = { ...snapshot, id };
      await setDoc(doc(db, 'snapshots', id), { ...finalSnapshot, createdAt: serverTimestamp() });

      // Also generate a report (mocking Gemini summary for now, will call backend later)
      const reportId = 'rep_' + Date.now();
      const report: SessionReport = {
        id: reportId,
        snapshotId: id,
        title: snapshot.metadata.title || 'Session Report',
        summary: `Captured a VR session in space ${snapshot.spaceId} with ${snapshot.metadata.participantCount} participants.`,
        actionItems: snapshot.transcription.filter(t => t.isActionItem),
        assetsCreatedCount: snapshot.canvasObjects.length + snapshot.sceneObjects.length,
        restoreLink: `${window.location.origin}/space/${snapshot.spaceId}?restore=${id}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'reports', reportId), { ...report, createdAt: serverTimestamp() });

      return finalSnapshot;
    },
    listSnapshots: async (spaceId: string): Promise<SessionSnapshot[]> => {
      const q = query(collection(db, 'snapshots'), where('spaceId', '==', spaceId));
      const s = await getDocs(q);
      return s.docs.map(d => ({ id: d.id, ...d.data() })) as SessionSnapshot[];
    },
    getSnapshot: async (id: string): Promise<SessionSnapshot | null> => {
      const d = await getDocs(query(collection(db, 'snapshots'), where('id', '==', id)));
      if (d.empty) return null;
      return d.docs[0].data() as SessionSnapshot;
    },
    getReport: async (snapshotId: string): Promise<SessionReport | null> => {
      const q = query(collection(db, 'reports'), where('snapshotId', '==', snapshotId));
      const s = await getDocs(q);
      if (s.empty) return null;
      return s.docs[0].data() as SessionReport;
    }
  },
  nexus: {
    discovery: async (query: string): Promise<any[]> => {
      try {
        const headers = await getAuthHeaders('POST', '/api/nexus/discovery');
        const response = await fetch(`${API_BASE_URL}/api/nexus/discovery?query=${encodeURIComponent(query)}`, {
          method: 'POST',
          headers
        });
        if (!response.ok) return [];
        return await response.json();
      } catch (e) {
        console.error("Nexus Discovery Error:", e);
        return [];
      }
    }
  }
};
