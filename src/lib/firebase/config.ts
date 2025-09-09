
import { initializeApp, getApps, getApp, FirebaseOptions, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, doc, getDoc, enableNetwork, connectFirestoreEmulator, disableNetwork } from "firebase/firestore";
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

let app = getApps().length ? getApp() : initializeApp(fallbackConfig);
let auth = getAuth(app);
let storage = getStorage(app);
let db = getFirestore(app);

// This flag prevents re-initialization in a hot-reload scenario
let isInitialized = false;

const initializeFirebaseServices = async () => {
    if (isInitialized) return;

    // Temporarily use the fallback config to fetch the actual config from Firestore
    const tempApp = initializeApp(fallbackConfig, "temp-for-config-fetch");
    const tempDb = getFirestore(tempApp);
    
    let finalConfig = fallbackConfig;

    try {
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
        // Clean up the temporary app
        await deleteApp(tempApp);
    }
    
    // Use the final configuration to initialize the main app
    if (getApps().length > 0) {
        // If apps are already initialized (e.g., from server-side render or previous client render),
        // we might need to delete the old one to re-initialize with the correct config.
        // This is tricky in Next.js, so we'll re-assign the services.
        const mainApp = getApps()[0];
        if (mainApp.options.projectId !== finalConfig.projectId) {
            // This is a complex scenario. For now, we'll log a warning.
            // A full page reload is often the simplest solution for the user after changing environments.
            console.warn("Firebase project ID changed. A page reload may be required for all services to update.");
            app = initializeApp(finalConfig);
        }
    } else {
        app = initializeApp(finalConfig);
    }

    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);

    isInitialized = true;
};

// Initialize on the client-side
if (typeof window !== 'undefined') {
    initializeFirebaseServices();
}

export { app, auth, db, storage, initializeFirebaseServices };
