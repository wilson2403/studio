
import { initializeApp, getApps, getApp, FirebaseOptions, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, doc, getDoc, enableNetwork, connectFirestoreEmulator, disableNetwork, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { EnvironmentSettings } from "@/types";

// Fallback configuration from environment variables
const fallbackConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app = getApps().length > 0 ? getApp() : initializeApp(fallbackConfig);
let auth = getAuth(app);
let storage = getStorage(app);
let db = getFirestore(app);

// This flag prevents re-initialization in a hot-reload scenario
let isInitialized = false;
let isInitializing = false;

const initializeFirebaseServices = async () => {
    if (isInitialized || isInitializing) return;
    isInitializing = true;
    
    let finalConfig = fallbackConfig;

    // Temporarily use the fallback config to fetch the actual config from Firestore
    // To avoid creating a 'DEFAULT' app conflict, we give it a unique name.
    let tempApp;
    try {
        tempApp = initializeApp(fallbackConfig, "config-fetch");
        const tempDb = getFirestore(tempApp);
        
        const docRef = doc(tempDb, 'settings', 'environment');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const settings = docSnap.data() as EnvironmentSettings;
            const activeEnv = settings.activeEnvironment || 'production';
            const config = settings.environments?.[activeEnv]?.firebaseConfig;
            if (config?.apiKey && config?.projectId) {
                finalConfig = config;
            }
        }
    } catch (error) {
        console.error("Could not fetch remote Firebase config, using fallback.", error);
    } finally {
        if (tempApp) {
            await deleteApp(tempApp);
        }
    }
    
    // Get or initialize the main app
    if (getApps().length > 0) {
        await deleteApp(getApp());
    }
    app = initializeApp(finalConfig);

    auth = getAuth(app);
    storage = getStorage(app);

    try {
      // Initialize Firestore with persistent cache if not already done.
      db = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
    } catch (e) {
      // Firestore is likely already initialized, so we just get the instance.
      db = getFirestore(app);
    }
    
    isInitialized = true;
    isInitializing = false;
};

// Initialize on the client-side
if (typeof window !== 'undefined' && !isInitialized) {
    initializeFirebaseServices();
}

export { app, auth, db, storage, initializeFirebaseServices };
