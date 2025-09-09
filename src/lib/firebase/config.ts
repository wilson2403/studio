
import { initializeApp, getApps, getApp, FirebaseOptions, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getSystemEnvironment } from "@/ai/flows/settings-flow";

let app;
let auth;
let db;
let storage;
let isInitialized = false;

const initializeFirebaseServices = async () => {
    if (isInitialized) {
        return;
    }

    try {
        const envSettings = await getSystemEnvironment();
        const activeEnv = envSettings.activeEnvironment || 'production';
        const config = envSettings.environments[activeEnv]?.firebaseConfig;
        
        const finalConfig: FirebaseOptions = {
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            projectId: config.projectId,
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
        };

        if (!getApps().length) {
            app = initializeApp(finalConfig);
        } else {
            app = getApp();
        }

        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        isInitialized = true;

    } catch (error) {
        console.error("Failed to initialize Firebase dynamically. Using fallback.", error);
        
        // Fallback to environment variables if dynamic config fails
        const fallbackConfig: FirebaseOptions = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        if (!getApps().length) {
            app = initializeApp(fallbackConfig);
        } else {
            app = getApp();
        }

        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        isInitialized = true;
    }
};

// Immediately call the async function. 
// We will await this promise before exporting the services.
const initializationPromise = initializeFirebaseServices();

export { app, auth, db, storage, initializationPromise };
