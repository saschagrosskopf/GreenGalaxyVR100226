import * as THREE from 'three';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { getAuth, signInWithCredential, GoogleAuthProvider, Auth, User as FirebaseUser } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { User } from './types';

// 1. Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 2. Init
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  console.log("✅ Firebase initialized successfully");
} catch (e) {
  console.error("❌ Firebase initialization failed:", e);
}

// @ts-ignore - exporting for legacy and new TS consumers
export { db, storage, auth };

// 3. Auth Function
export const authenticateWithGoogle = async (idToken: string): Promise<FirebaseUser> => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    // Create a credential from the Google ID token
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in with the credential
    const result = await signInWithCredential(auth, credential);

    console.log("🔥 Firebase Auth Success");
    return result.user;
  } catch (error) {
    console.error("Firebase Auth Failed:", error);
    throw error;
  }
};

// 4. State Management
let lastSaveTime = 0;
const lastSavedPos = new THREE.Vector3(0, 0, 0);
const SAVE_INTERVAL = 2000; // 2 seconds
const MIN_DISTANCE = 0.5;   // At least 0.5 units of movement

// Persistent session ID in memory (truly unique per load)
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
console.log("🚀 GreenGalaxy Session ID:", sessionId);

// 5. USER PERSISTENCE - Save User Data for Later Return
export const saveUserToFirestore = async (user: User): Promise<boolean> => {
  if (!user || !user.id) return false;

  try {
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, {
      id: user.id || '',
      email: user.email || '',
      name: user.name || 'Unknown User',
      picture: user.picture || '',
      role: user.role || 'USER',
      orgId: user.orgId || 'org_def',
      lastLogin: new Date().toISOString(),
      createdAt: user.createdAt || new Date().toISOString()
    }, { merge: true });

    console.log("✅ User saved to Firestore:", user.email);
    return true;
  } catch (e) {
    console.error("❌ Failed to save user to Firestore:", e);
    return false;
  }
};

// 6. GET USER - Retrieve User Data on Return
export const getUserFromFirestore = async (userId: string): Promise<any | null> => {
  if (!userId) return null;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("✅ User found in Firestore");
      return userSnap.data();
    }
    return null;
  } catch (e) {
    console.error("❌ Failed to get user from Firestore:", e);
    return null;
  }
};

// 7. Optimized Save Function (Player Position)
export const savePlayerPosition = async (x: number, y: number, z: number): Promise<void> => {
  const now = Date.now();
  const currentPos = new THREE.Vector3(x, y, z);

  // Check 1: Enough time passed?
  if (now - lastSaveTime < SAVE_INTERVAL) return;

  // Check 2: Moved enough?
  if (currentPos.distanceTo(lastSavedPos) < MIN_DISTANCE) return;

  try {
    // Update local state first
    lastSaveTime = now;
    lastSavedPos.copy(currentPos);

    // Write to DB
    await setDoc(doc(db, "players", sessionId), {
      x,
      y,
      z,
      lastUpdate: new Date().toISOString(),
      active: true
    }, { merge: true });

  } catch (e) {
    console.error("DB Error:", e);
  }
};

export const getSessionId = () => sessionId;