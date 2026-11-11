import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// Environment variables configured for Vercel / Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);

    // Initialize Firestore with multi-tab persistent IndexedDB caching
    // Allows seamless offline camp data entry without loss of internet connection
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('Firebase initialization error, running in local persistence mode:', err);
  }
}

export { app, auth, db, signInAnonymously, onAuthStateChanged, collection, doc, setDoc, deleteDoc, onSnapshot };

// LocalStorage Persistence Helpers for Offline / Demo / Fallback Mode
const STORAGE_KEYS = {
  CAMPS: 'avm_dental_camps_v1',
  PATIENTS: 'avm_dental_patients_v1',
  STAFF: 'avm_dental_staff_v1',
  DIAGNOSES: 'avm_dental_diagnoses_v1',
  TOOTH_DIAGNOSES: 'avm_dental_tooth_diagnoses_v1',
  CLINIC_PROFILE: 'avm_dental_clinic_profile_v1'
};

export const loadLocalFallback = (key, defaultData) => {
  try {
    const storageKey = STORAGE_KEYS[key] || `avm_${String(key).toLowerCase()}_v1`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate that arrays stay arrays and objects stay objects
      if (Array.isArray(defaultData)) {
        return Array.isArray(parsed) ? parsed : defaultData;
      }
      if (typeof defaultData === 'object' && defaultData !== null) {
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          ? parsed
          : defaultData;
      }
      return parsed;
    }
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
  }
  return defaultData;
};

export const saveLocalFallback = (key, data) => {
  try {
    const storageKey = STORAGE_KEYS[key] || `avm_${String(key).toLowerCase()}_v1`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error saving ${key} to localStorage:`, err);
  }
};
