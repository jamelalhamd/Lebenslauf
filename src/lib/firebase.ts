import { initializeApp, FirebaseApp, deleteApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore, getFirestore, Firestore,
  persistentLocalCache, CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// ===== YOUR FIREBASE CONFIG =====
export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyB5mEfMA8_FqFtOPwA9bWgHsCOhx0fhrX4",
  authDomain: "lebenslauf-aec7c.firebaseapp.com",
  projectId: "lebenslauf-aec7c",
  storageBucket: "lebenslauf-aec7c.firebasestorage.app",
  messagingSenderId: "208458852084",
  appId: "1:208458852084:web:7c8d6fe1166855dc5d20a1",
  measurementId: "G-KQ408PHYYS",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function initializeFirebase(config: FirebaseConfig = FIREBASE_CONFIG): boolean {
  try {
    if (app) return true;
    app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);
    // Persistent IndexedDB cache survives page refreshes and enables offline reads.
    // Falls back to in-memory if IndexedDB is unavailable (e.g. private/incognito).
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
      });
    } catch {
      db = getFirestore(app);
    }
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (e) {
    console.error('❌ Firebase init error:', e);
    app = null; auth = null; db = null; storage = null;
    return false;
  }
}

export function getAuthRef(): Auth | null { return auth; }
export function getDb(): Firestore | null { return db; }
export function getStorageRef(): FirebaseStorage | null { return storage; }
export function isInitialized(): boolean { return !!db; }

export async function resetFirebase(): Promise<void> {
  if (app) await deleteApp(app);
  app = null; auth = null; db = null; storage = null;
}

// Auto-init on import
initializeFirebase();
