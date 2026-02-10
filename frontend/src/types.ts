

export enum View {
  DASHBOARD = 'DASHBOARD',
  SPACES = 'SPACES',
  ASSETS = 'ASSETS',
  IDEAS = 'IDEAS',
  DEVICES = 'DEVICES',

  PUBLISH = 'PUBLISH',
  PROFILE = 'PROFILE',
  TEAM = 'TEAM',
  BRAND = 'BRAND',
  ORG_SETTINGS = 'ORG_SETTINGS',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  XR_PREVIEW = 'XR_PREVIEW',
  NEXUS_HUB = 'NEXUS_HUB',
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  orgId: string;
  lastLogin?: string;
  customAvatarModelUrl?: string;
  avatarUrl?: string;  // Ready Player Me avatar URL
  createdAt?: string;
  // Smart Capture & Integrations fields
  businessRole?: string;
  primaryIntent?: string;
  hasCompletedOnboarding?: boolean;
  hasCompletedMixboardOnboarding?: boolean;
  labsTool?: 'gemini-pro' | 'gemini-flash' | 'imagen-3';
}

export interface TranscriptionItem {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isActionItem?: boolean;
  assignedTo?: string;
}

export interface SessionSnapshot {
  id: string;
  spaceId: string;
  timestamp: number;
  capturedBy: string;
  sceneObjects: any[];
  canvasObjects: any[];
  transcription: TranscriptionItem[];
  dashboards: Record<string, any>;
  metadata: {
    duration: number;
    participantCount: number;
    title: string;
  };
}

export interface SessionReport {
  id: string;
  snapshotId: string;
  title: string;
  summary: string;
  actionItems: TranscriptionItem[];
  assetsCreatedCount: number;
  restoreLink: string;
  createdAt: string;
}

export interface FurnitureMap {
  chairUrl?: string;
  tableUrl?: string;
  lampUrl?: string;
  artUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  heroUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline?: string;
  defaultSpaceTemplateId?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  domains: string[];
  isBrandVerified: boolean;
  plan: 'FREE' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'NONE';
  billingEmail?: string;
  furnitureMap?: FurnitureMap; // New Field
}

export interface Asset {
  id: string;
  name: string;
  type: 'model' | 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  size: number;
  // Added updatedAt field to satisfy API implementation
  updatedAt?: string;
  // Category for organizing assets (full scenes vs individual furniture)
  category?: 'scene' | 'furniture' | 'collider' | 'skybox';
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'ready' | 'live';
  templateId: string;
  thumbnailUrl?: string;
  updatedAt: string;
  orgId: string;
  customAssets?: Asset[];
  castShadows?: boolean;
}

export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'pairing';
  lastSeen: string;
  defaultSpaceId?: string;
}

export interface Idea {
  id: string;
  prompt: string;
  description: string;
  suggestedProps: string[];
  layoutHints: string;
  createdAt: string;
}

export interface SceneObject {
  id?: string;
  version?: number;
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

export interface Session {
  token: string;
  user: User;
  org: Organization;
}

export interface AuthResponse {
  status: 'ok' | 'needsRegistration' | 'error';
  session?: Session;
  googleProfile?: {
    email: string;
    name: string;
    picture: string;
    sub: string;
  };
}

// XR Types
export interface RoomConfig {
  wallColor: string;
  logoUrl?: string;
  furnitureMap?: FurnitureMap;
}

export enum AppMode {
  DASHBOARD = 'Dashboard',
  MAIL = 'Mail',
  DOCS = 'Docs',
  CALENDAR = 'Calendar',
  SETTINGS = 'Settings'
}

export interface WorkspaceState {
  currentInput: string;
  generatedContent: string;
  isLoading: boolean;
  activeApp: AppMode;
  emails: any[];
  calendarEvents: any[];
}

// Global JSX Declaration for React Three Fiber
// This ensures that Three.js elements like <group>, <mesh>, etc. are recognized by TypeScript.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      boxGeometry: any;
      circleGeometry: any;
      color: any;
      coneGeometry: any;
      cylinderGeometry: any;
      directionalLight: any;
      fog: any;
      gridHelper: any;
      group: any;
      icosahedronGeometry: any;
      mesh: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      meshStandardMaterial: any;
      planeGeometry: any;
      pointLight: any;
      primitive: any;
      ringGeometry: any;
      sphereGeometry: any;
      spotLight: any;
      torusGeometry: any;
      torusKnotGeometry: any;
      [elemName: string]: any;
    }
  }

  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        ambientLight: any;
        boxGeometry: any;
        circleGeometry: any;
        color: any;
        coneGeometry: any;
        cylinderGeometry: any;
        directionalLight: any;
        fog: any;
        gridHelper: any;
        group: any;
        icosahedronGeometry: any;
        mesh: any;
        meshBasicMaterial: any;
        meshPhysicalMaterial: any;
        meshStandardMaterial: any;
        planeGeometry: any;
        pointLight: any;
        primitive: any;
        ringGeometry: any;
        sphereGeometry: any;
        spotLight: any;
        torusGeometry: any;
        torusKnotGeometry: any;
        [elemName: string]: any;
      }
    }
  }
}