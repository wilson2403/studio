
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, memoryLocalCache, doc, getDoc } from "firebase/firestore";
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
    // This temporary DB instance is just for fetching the config.
    const tempDb = getFirestore(app); 
    const docRef = doc(tempDb, 'settings', 'environment');
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
    } else if (
        app.options.projectId !== firebaseConfig.projectId
    ) {
        // If the project ID is different, we must create a new app instance.
        // This is a simplified approach; a real-world scenario might need more complex handling.
        console.warn(`Switching Firebase project from ${app.options.projectId} to ${firebaseConfig.projectId}`);
        app = initializeApp(firebaseConfig, `app-${firebaseConfig.projectId}`);
    } else {
        app = getApp();
    }
    
    auth = getAuth(app);
    storage = getStorage(app);

    // Initialize Firestore with appropriate cache settings
    if (typeof window !== 'undefined') {
        try {
            db = initializeFirestore(app, {
                localCache: persistentLocalCache(),
            });
        } catch (e) {
            console.error("Failed to initialize persistent cache. Using memory cache.", e);
            db = getFirestore(app); // fallback for initialization
        }
    } else {
        db = getFirestore(app);
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    initializeFirebaseServices();
}


export { app, auth, db, storage, initializeFirebaseServices };
