
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, memoryLocalCache, doc, getDoc, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { EnvironmentSettings } from "@/types";

// Default configuration from environment variables (acts as a fallback)
const defaultFirebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app = getApps().length ? getApp() : initializeApp(defaultFirebaseConfig);
let auth = getAuth(app);
let storage = getStorage(app);
let db = getFirestore(app);

// Function to get the dynamic configuration from Firestore
const getDynamicConfig = async (): Promise<FirebaseOptions> => {
    // Use the existing db instance for fetching
    const docRef = doc(db, 'settings', 'environment');
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const settings = docSnap.data() as EnvironmentSettings;
            const activeEnv = settings.activeEnvironment || 'production';
            const config = settings.environments?.[activeEnv]?.firebaseConfig;
            if (config?.apiKey && config?.projectId) {
                return config;
            }
        }
    } catch (error) {
        console.error("Could not fetch remote Firebase config, falling back to default.", error);
    }
    return defaultFirebaseConfig;
};

// Re-initialization logic
const initializeFirebaseServices = async () => {
    const firebaseConfig = await getDynamicConfig();
    
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        // If an app with the same config is already initialized, get it. Otherwise, this might not work as expected in HMR without creating a named app.
        app = getApps().find(a => a.options.projectId === firebaseConfig.projectId) || getApp();
    }
    
    auth = getAuth(app);
    storage = getStorage(app);

    try {
      db = getFirestore(app);
    } catch (e) {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache(),
      });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    initializeFirebaseServices();
}


export { app, auth, db, storage, initializeFirebaseServices };
