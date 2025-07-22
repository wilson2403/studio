
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Check if user document already exists
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        // New user
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            providerId: result.providerId,
            isAdmin: user.email === ADMIN_EMAIL,
            questionnaireCompleted: false,
            status: 'Interesado',
        }, { merge: true });
        sessionStorage.setItem('tour_status', 'pending');
    } else {
        // Returning user, but ensure tour status is cleared
        sessionStorage.removeItem('tour_status');
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName: string, phone?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile and send verification email
    await updateProfile(user, { displayName });
    await sendEmailVerification(user);

    // Create user document in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      phone: phone || null,
      photoURL: user.photoURL,
      providerId: 'password',
      isAdmin: user.email === ADMIN_EMAIL,
      questionnaireCompleted: false,
      status: 'Interesado',
    });
    
    sessionStorage.setItem('tour_status', 'pending');

    return user;
  } catch (error) {
    console.error("Error signing up with email: ", error);
    throw error;
  }
};


export const signInWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        sessionStorage.removeItem('tour_status');
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in with email: ", error);
        throw error;
    }
}

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    sessionStorage.clear();
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

    