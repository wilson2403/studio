
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
  updateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { logError } from './firestore';

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
    await logError(error, { function: 'signInWithGoogle' });
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName: string, countryCode?: string, phone?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile and send verification email
    await updateProfile(user, { displayName });
    await sendEmailVerification(user);
    
    const dialCode = countryCode ? countryCode.split('-')[1] : undefined;
    const fullPhoneNumber = phone && dialCode
        ? `${dialCode}${phone.replace(/\D/g, '')}`
        : undefined;

    // Create user document in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      phone: fullPhoneNumber,
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
    await logError(error, { function: 'signUpWithEmail' });
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
        await logError(error, { function: 'signInWithEmail' });
        throw error;
    }
}

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    sessionStorage.clear();
  } catch (error) {
    console.error("Error signing out: ", error);
    await logError(error, { function: 'signOut' });
    throw error;
  }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is signed in to re-authenticate.");
    if (!user.email) throw new Error("Cannot re-authenticate user without an email.");

    const credential = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(user, credential);
};


export const updateUserEmail = async (newEmail: string, currentPassword?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is signed in.");
    if (!currentPassword) throw new Error("Current password is required to update email.");

    try {
        // Re-authentication is required for sensitive operations like changing an email.
        await reauthenticate(currentPassword);
        await updateEmail(user, newEmail);
        // Also update the email in your Firestore database
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { email: newEmail }, { merge: true });

    } catch (error) {
        console.error("Error updating email:", error);
        await logError(error, { function: 'updateUserEmail' });
        throw error;
    }
};

export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is signed in.");
    
    try {
        // Re-authentication is also required for changing the password.
        await reauthenticate(currentPassword);
        await firebaseUpdatePassword(user, newPassword);
    } catch (error) {
        console.error("Error updating password:", error);
        await logError(error, { function: 'updateUserPassword' });
        throw error;
    }
};
