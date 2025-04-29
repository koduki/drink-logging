// Suggested code may be subject to a license. Learn more: ~LicenseLog:3594406520.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:4194694453.
// src/services/firebase.ts
import { initializeApp, type FirebaseApp, getApps, getApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import getStorage

// Define firebaseConfig directly in this file
// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} else {
  app = getApp();
  console.log("Firebase app already initialized");
}


// Initialize Firestore
const db: Firestore = getFirestore(app);
console.log("Firestore initialized successfully");

// Initialize Storage
const storage = getStorage(app);
console.log("Firebase Storage initialized successfully");

export { app, db, storage }; // Export storage as well
