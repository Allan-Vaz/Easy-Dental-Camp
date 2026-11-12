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
    let raw = localStorage.getItem(storageKey);

    // Migration fallback: If clinic profile is not yet in primary key, look in legacy keys
    if (!raw && key === 'CLINIC_PROFILE') {
      const legacyKeys = ['avm_clinic_profile_v1', 'clinic_profile', 'undefined'];
      for (const lk of legacyKeys) {
        const legacyVal = localStorage.getItem(lk);
        if (legacyVal) {
          try {
            const parsedLegacy = JSON.parse(legacyVal);
            if (
              parsedLegacy &&
              typeof parsedLegacy === 'object' &&
              !Array.isArray(parsedLegacy) &&
              (parsedLegacy.clinicName || parsedLegacy.doctorName)
            ) {
              raw = legacyVal;
              // Migrate to the canonical key immediately
              localStorage.setItem(storageKey, legacyVal);
              break;
            }
          } catch {
            // Ignore parse errors on legacy keys
          }
        }
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate that arrays stay arrays and objects stay objects
      if (Array.isArray(defaultData)) {
        return Array.isArray(parsed) ? parsed : defaultData;
      }
      if (typeof defaultData === 'object' && defaultData !== null) {
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          ? { ...defaultData, ...parsed }
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
    // If quota exceeded and saving clinic profile, try saving with stripped heavy images so critical text profile is never lost
    if (key === 'CLINIC_PROFILE' && typeof data === 'object' && data !== null) {
      try {
        const storageKey = STORAGE_KEYS[key] || `avm_${String(key).toLowerCase()}_v1`;
        const textOnlyProfile = {
          ...data,
          voucherPromoImageData: '', // Strip heaviest graphic to preserve profile
        };
        localStorage.setItem(storageKey, JSON.stringify(textOnlyProfile));
        console.warn('Saved clinic profile without heavy promo image due to storage quota.');
      } catch (innerErr) {
        console.error('Fatal LocalStorage save error:', innerErr);
      }
    }
  }
};
