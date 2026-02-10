import { User, Organization, Space, Session, Asset, Idea, Device, AuthResponse, View } from '../types';
// @ts-ignore
import { storage, db } from '../logic.js';
// @ts-ignore
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// @ts-ignore
import { collection, getDocs, doc, setDoc, onSnapshot, query, where, writeBatch, deleteDoc, addDoc, serverTimestamp, orderBy, DocumentData } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================
export interface SceneObject {
    id?: string;
    type: 'box' | 'cylinder' | 'sphere' | 'plane' | 'model' | 'screen' | 'note' | 'sticky_note' | 'board_col' | 'floor_zone' | 'teleport' | 'product' | 'sticker';
    pos: { x: number; y: number; z: number };
    rot?: { x: number; y: number; z: number };
    size?: { w?: number; h?: number; d?: number; r?: number };
    color?: string;
    content?: string;
    title?: string;
    label?: string;
    target?: { x: number; y: number; z: number };
    url?: string;
    createdAt?: any;
}

export interface WorkshopTemplate {
    id: string;
    name: string;
    objects: SceneObject[];
}

// ==========================================
// 2. THE 4 DEFINITIVE ROOM TEMPLATES
// ==========================================
export const WORKSHOP_TEMPLATES: WorkshopTemplate[] = [
  // 1. BOARDROOM (Corporate / Presentation focus)
  {
    id: 'template_boardroom',
    name: 'Executive Boardroom',
    objects: [
      { type: 'screen', title: 'MAIN', pos: {x: 0, y: 3, z: -7}, size: {w: 8, h: 4.5}, rot: {x:0, y:0, z:0}, color: '#2d3436', content: 'EXECUTIVE OVERVIEW' },
      { type: 'screen', title: 'CALENDAR', pos: {x: -6, y: 2.5, z: -6}, size: {w: 4, h: 3}, rot: {x:0, y:30, z:0}, color: '#4285F4', content: 'Q4 SCHEDULE' },
      { type: 'screen', title: 'SHEETS', pos: {x: 6, y: 2.5, z: -6}, size: {w: 4, h: 3}, rot: {x:0, y:-30, z:0}, color: '#0F9D58', content: 'REVENUE DATA' },
      { type: 'box', title: 'Table Top', pos: {x: 0, y: 0.8, z: 0}, size: {w: 8, h: 0.1, d: 3}, color: '#2d3436' },
      { type: 'cylinder', title: 'Table Leg L', pos: {x: -2, y: 0.4, z: 0}, size: {h: 0.8, r: 0.4}, color: '#636e72' },
      { type: 'cylinder', title: 'Table Leg R', pos: {x: 2, y: 0.4, z: 0}, size: {h: 0.8, r: 0.4}, color: '#636e72' },
      { type: 'board_col', title: 'BACKLOG', pos: {x: -10, y: 4, z: 0}, size: {w: 4, h: 6}, rot: {x:0, y:90, z:0}, color: '#ff7675' },
      { type: 'board_col', title: 'DONE', pos: {x: 10, y: 4, z: 0}, size: {w: 4, h: 6}, rot: {x:0, y:-90, z:0}, color: '#55efc4' },
      { type: 'floor_zone', title: 'EXECUTIVE ZONE', pos: {x: 0, y: 0.05, z: 0}, size: {w: 16, h: 12}, rot: {x:-90,y:0,z:0}, color: '#b2bec3' }
    ]
  },

  // 2. STUDIO (Agile / Creative focus)
  {
    id: 'template_studio',
    name: 'Creative Studio',
    objects: [
      { type: 'screen', title: 'BRIEF', pos: {x: 0, y: 3, z: -8}, size: {w: 8, h: 4}, rot: {x:0, y:0, z:0}, color: '#111', content: 'CLIENT BRIEF' },
      { type: 'screen', title: 'MOODBOARD', pos: {x: -8, y: 3, z: 0}, size: {w: 6, h: 4}, rot: {x:0, y:90, z:0}, color: '#fab1a0', content: 'INSPIRATION' },
      { type: 'screen', title: 'TASKS', pos: {x: 8, y: 3, z: 0}, size: {w: 6, h: 4}, rot: {x:0, y:-90, z:0}, color: '#ffeaa7', content: 'SPRINT TASKS' },
      { type: 'box', title: 'Desk 1', pos: {x: -4, y: 0.8, z: -3}, size: {w: 4, h: 0.1, d: 2}, color: '#ffffff' },
      { type: 'box', title: 'Desk 2', pos: {x: 4, y: 0.8, z: -3}, size: {w: 4, h: 0.1, d: 2}, color: '#ffffff' },
      { type: 'floor_zone', title: 'DESIGN GRID', pos: {x: 0, y: 0.05, z: 0}, size: {w: 20, h: 20}, rot: {x:-90,y:0,z:0}, color: '#f5f6fa' }
    ]
  },

  // 3. ZEN LAB (Meditation / Focus focus)
  {
    id: 'template_zen',
    name: 'Zen Brainlab',
    objects: [
      { type: 'screen', title: 'FOCUS', pos: {x: 0, y: 2.2, z: -6}, size: {w: 5, h: 2.8}, color: '#55efc4', content: 'BREATHE' },
      { type: 'cylinder', title: 'Zen Base', pos: {x: 0, y: 0.1, z: 0}, size: {h: 0.1, r: 6}, color: '#111' },
      { type: 'sphere', title: 'Floating Orb', pos: {x: 0, y: 1.5, z: 0}, size: {r: 0.5}, color: '#ffffff' },
      { type: 'box', title: 'Meditation Pad', pos: {x: 0, y: 0.2, z: 3}, size: {w: 2, h: 0.1, d: 2}, color: '#81ecec' },
      { type: 'floor_zone', title: 'QUIET ZONE', pos: {x: 0, y: 0.05, z: 0}, size: {w: 12, h: 12}, rot: {x:-90,y:0,z:0}, color: '#111' }
    ]
  },

  // 4. MALL (Retail / Expo focus)
  {
    id: 'template_mall',
    name: 'Shopping Museum Hub',
    objects: [
      { type: 'box', title: 'Main Floor', pos: {x: 0, y: 0.05, z: 0}, size: {w: 20, h: 0.1, d: 20}, color: '#f5f6fa' },
      { type: 'teleport', label: 'TECH WING', target: {x: 0, y: 2, z: 50}, pos: {x: 0, y: 0.1, z: 8}, color: '#00cec9' },
      { type: 'teleport', label: 'ART WING', target: {x: 0, y: 2, z: -50}, pos: {x: 0, y: 0.1, z: -8}, color: '#d63031' },
      { type: 'box', title: 'Tech Zone', pos: {x: 0, y: 0.1, z: 50}, size: {w: 30, h: 0.1, d: 30}, color: '#2d3436' },
      { type: 'product', content: 'HOLOGRAPHIC UNIT', pos: {x: 0, y: 2, z: 50}, color: '#0984e3' },
      { type: 'teleport', label: 'HUB', target: {x: 0, y: 2, z: 0}, pos: {x: 0, y: 0.1, z: 40}, color: '#fdcb6e' }
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
        google: async (credential: string): Promise<AuthResponse> => ({
            status: 'ok',
            session: { 
                token: credential, 
                user: SEED_USER, 
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
            }
        }),
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
                 return s.docs.map((d: any) => ({id: d.id, ...d.data()})) as Asset[];
             } catch(e) { 
                 const local = localStorage.getItem('gg_db_assets');
                 return local ? JSON.parse(local) : [];
             }
        },
        upload: async (file: File): Promise<Asset> => {
            console.log("🔥 STARTING REAL FIREBASE UPLOAD:", file.name);
            try {
                const storageRef = ref(storage, 'assets/' + Date.now() + '_' + file.name);
                const snapshot = await uploadBytesResumable(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                
                const asset: Asset = { 
                    id: 'asset_'+Date.now(), 
                    name: file.name, 
                    type: file.name.toLowerCase().endsWith('.glb') ? 'model' : 'image', 
                    url, 
                    size: file.size, 
                    updatedAt: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'assets', asset.id), { ...asset, createdAt: serverTimestamp() });
                const current = JSON.parse(localStorage.getItem('gg_db_assets') || '[]');
                current.push(asset);
                localStorage.setItem('gg_db_assets', JSON.stringify(current));
                return asset;
            } catch(e) {
                console.error("❌ UPLOAD FAILED:", e);
                throw e;
            }
        },
        delete: async (id: string) => {
            await deleteDoc(doc(db, 'assets', id));
            const current = JSON.parse(localStorage.getItem('gg_db_assets') || '[]');
            localStorage.setItem('gg_db_assets', JSON.stringify(current.filter((a: any) => a.id !== id)));
        }
    },

    spaces: {
        getWorkshopTemplates: () => WORKSHOP_TEMPLATES,
        list: async (orgId?: string): Promise<Space[]> => {
             const custom = JSON.parse(localStorage.getItem('gg_db_spaces') || '[]');
             const seeds = [
                 { id: 'seed_boardroom', name: 'Executive HQ', status: 'live', templateId: 'template_boardroom', orgId: 'org_def', updatedAt: new Date().toISOString(), thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
                 { id: 'seed_studio', name: 'Agile Sandbox', status: 'ready', templateId: 'template_studio', orgId: 'org_def', updatedAt: new Date().toISOString(), thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80' },
                 { id: 'seed_zen', name: 'Zen Lab', status: 'ready', templateId: 'template_zen', orgId: 'org_def', updatedAt: new Date().toISOString(), thumbnailUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' },
                 { id: 'seed_mall', name: 'Virtual Expo', status: 'live', templateId: 'template_mall', orgId: 'org_def', updatedAt: new Date().toISOString(), thumbnailUrl: 'https://images.unsplash.com/photo-1519567241046-7f570eee3d9f?auto=format&fit=crop&w=800&q=80' }
             ];
             return [...seeds, ...custom];
        },
        create: async (space: Space, variantId?: string): Promise<Space> => {
            const spaces = JSON.parse(localStorage.getItem('gg_db_spaces') || '[]');
            spaces.unshift(space);
            localStorage.setItem('gg_db_spaces', JSON.stringify(spaces));
            if (variantId || space.templateId) {
              await api.spaces.hydrateSpace(space.id, variantId || space.templateId);
            }
            return space;
        },
        createCustom: async (name: string, assets: Asset[], orgId?: string): Promise<Space> => {
            const newSpace: Space = { 
                id: 'custom_' + Date.now(), 
                name: name || 'Custom VR Space', 
                customAssets: assets, 
                templateId: 'custom',
                status: 'ready',
                thumbnailUrl: 'https://placehold.co/600x400?text=Custom+Space',
                updatedAt: new Date().toISOString(),
                orgId: orgId || 'org_def'
            };
            const s = JSON.parse(localStorage.getItem('gg_db_spaces') || '[]');
            s.unshift(newSpace);
            localStorage.setItem('gg_db_spaces', JSON.stringify(s));
            return newSpace;
        },
        hydrateSpace: async (spaceId: string, templateId: string) => {
            console.log("🏗️ Hydrating Space:", spaceId, "with", templateId);
            const template = WORKSHOP_TEMPLATES.find(t => t.id === templateId) || WORKSHOP_TEMPLATES[0];
            const batch = writeBatch(db);
            template.objects.forEach(obj => {
                const objectRef = doc(collection(db, 'spaces', spaceId, 'sceneObjects'));
                batch.set(objectRef, { 
                    ...obj, 
                    id: objectRef.id, 
                    createdAt: serverTimestamp(),
                    size: { w: obj.size?.w??1, h: obj.size?.h??1, d: obj.size?.d??1, r: obj.size?.r??0.5 }
                });
            });
            await batch.commit();
        },
        delete: async (id: string) => {
          const spaces = JSON.parse(localStorage.getItem('gg_db_spaces') || '[]');
          localStorage.setItem('gg_db_spaces', JSON.stringify(spaces.filter((s: any) => s.id !== id)));
        },
        attachIdea: async (spaceId: string, ideaId: string) => {}
    },
    
    scenes: { 
        addSceneObject: async (sid: string, d: any) => {
            return await addDoc(collection(db, 'spaces', sid, 'sceneObjects'), {
                ...d, createdAt: serverTimestamp()
            });
        },
        updateObject: async (sid: string, oid: string, d: any) => {
            return await setDoc(doc(db, 'spaces', sid, 'sceneObjects', oid), d, { merge: true });
        }
    },
    
    multiplayer: { 
        listenForOtherUsers: (currentUserId: string, callback: (update: any) => void) => {
          const q = query(collection(db, 'players'));
          return onSnapshot(q, (snapshot: any) => {
            snapshot.docChanges().forEach((change: any) => {
              if (change.doc.id !== currentUserId) {
                callback({ id: change.doc.id, ...change.doc.data(), changeType: change.type });
              }
            });
          });
        },
        updatePosition: async (id: string, data: any) => {
          try { await setDoc(doc(db, 'players', id), { ...data, lastSeen: Date.now() }, { merge: true }); } catch (e) {}
        },
        removeUser: async (id: string) => {
          try { await deleteDoc(doc(db, 'players', id)); } catch (e) {}
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
      updateBranding: async (data: Organization) => {},
      update: async (id: string, data: Partial<Organization>) => {}
    },

    team: {
      list: async (): Promise<User[]> => [SEED_USER],
      invite: async (emails: string[]) => {},
      updateProfile: async (data: any) => {}
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
      verifyOrg: async (id: string) => {},
      rejectOrg: async (id: string) => {}
    },

    ai: {
      generateWorkshopLayout: async (topic: string): Promise<SceneObject[]> => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Generate a 3D workshop layout for: "${topic}". Return a JSON array of objects with types 'box', 'cylinder', 'sticky_note'. Each object needs: type, title, color, pos{x,y,z}, size{w,h,d,r}, rot{x,y,z}.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    color: { type: Type.STRING },
                    pos: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
                    size: { type: Type.OBJECT, properties: { w: { type: Type.NUMBER }, h: { type: Type.NUMBER }, d: { type: Type.NUMBER }, r: { type: Type.NUMBER } } },
                    rot: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } }
                  }
                }
              }
            }
          });
          return JSON.parse(response.text || "[]");
        } catch (e) { return []; }
      }
    }
};