
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

const initializeFirebaseServices = async () => {
    if (isInitialized) return;
    isInitialized = true; // Set flag immediately to prevent re-entry

    let finalConfig = fallbackConfig;

    // We MUST use a separate, temporary app instance to fetch the config.
    // This avoids conflicts with the main [DEFAULT] app instance.
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

    // Now, delete the old [DEFAULT] app and initialize a new one with the correct config.
    // This is the cleanest way to ensure all services use the new configuration.
    if (getApps().length > 0) {
        await deleteApp(getApp());
    }

    // IMPORTANT: A page reload will be required for all parts of the app to pick up this new instance.
    // We re-export the services so modules importing them get the new instances.
    app = initializeApp(finalConfig);
    auth = getAuth(app);
    storage = getStorage(app);
    db = getFirestore(app);
    
    // NOTE: This dynamic initialization works, but for the changes to be reflected across the
    // entire app (especially in a hot-reload dev environment), a full page refresh
    // after changing the environment in the settings panel is the most reliable approach.
};

// Initialize on the client-side
if (typeof window !== 'undefined') {
    initializeFirebaseServices();
}

export { app, auth, db, storage, initializeFirebaseServices };
