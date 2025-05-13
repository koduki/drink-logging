// Suggested code may be subject to a license. Learn more: ~LicenseLog:3594406520.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:4194694453.
// src/services/firebase.ts
import { initializeApp, type FirebaseApp, getApps, getApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import getStorage

// Helper function to safely get and trim environment variables
const getEnvVar = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : undefined;
};

// Define firebaseConfig directly in this file
const firebaseConfig = {
    apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID')
};

// --- Debug code START ---
// Log Firebase config and API key on the client-side
if (typeof window !== 'undefined') {
    console.log('CLIENT_SIDE_RAW_API_KEY_FROM_ENV:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log('CLIENT_SIDE_TRIMMED_API_KEY:', firebaseConfig.apiKey);
    console.log('CLIENT_SIDE_FIREBASE_CONFIG_AFTER_TRIM:', firebaseConfig);
    console.log('CLIENT_SIDE_PROJECT_ID_FROM_ENV:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}
// --- Debug code END ---

// Initialize Firebase
let app: FirebaseApp;
// Ensure all necessary config values are present before initializing
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig as any); // Cast as any to handle potential undefined after trim, though guarded by if
        console.log("Firebase initialized successfully");
    } else {
        app = getApp();
        console.log("Firebase app already initialized");
    }
} else {
    console.error('Firebase configuration is incomplete. API Key, Project ID, or App ID might be missing or invalid after trimming.');
    // Handle the error appropriately - perhaps by not initializing Firebase or showing an error to the user
}

// Initialize Firestore only if app was initialized
let db: Firestore | undefined = undefined;
if (app!) { // Use non-null assertion if you are sure app will be initialized or handle it gracefully
    db = getFirestore(app);
    // console.log("Firestore initialized successfully");
}

// Initialize Storage only if app was initialized
let storage: any | undefined = undefined; // Using 'any' for getStorage if FirebaseApp might be undefined
if (app!) {
    storage = getStorage(app);
    // console.log("Firebase Storage initialized successfully");
}

export { app, db, storage };
