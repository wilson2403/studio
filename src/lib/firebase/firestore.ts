

import { collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc, getDoc, query, serverTimestamp, writeBatch, where, orderBy, increment, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { db, storage } from './config';
import type { Ceremony, Guide, UserProfile, ThemeSettings, Chat, ChatMessage, QuestionnaireAnswers, UserStatus, ErrorLog, InvitationMessage, BackupData, SectionClickLog, SectionAnalytics, Course, VideoProgress, UserRole, AuditLog, CeremonyInvitationMessage, Testimonial } from '@/types';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth } from './config';

const ceremoniesCollection = collection(db, 'ceremonies');
const contentCollection = collection(db, 'content');
const guidesCollection = collection(db, 'guides');
const usersCollection = collection(db, 'users');
const settingsCollection = collection(db, 'settings');
const chatsCollection = collection(db, 'chats');
const questionnairesCollection = collection(db, 'questionnaires');
const errorLogsCollection = collection(db, 'error_logs');
const invitationMessagesCollection = collection(db, 'invitationMessages');
const ceremonyInvitationMessagesCollection = collection(db, 'ceremonyInvitationMessages');
const analyticsCollection = collection(db, 'analytics');
const coursesCollection = collection(db, 'courses');
const auditLogsCollection = collection(db, 'audit_logs');
const testimonialsCollection = collection(db, 'testimonials');


export const logError = (error: any, context?: Record<string, any>) => {
    try {
        addDoc(errorLogsCollection, {
            message: error.message,
            stack: error.stack,
            context: context || {},
            timestamp: serverTimestamp(),
            status: 'new'
        });
    } catch (e) {
        console.error("Failed to log error to Firestore:", e);
    }
};

export const logUserAction = async (action: string, details?: Partial<Omit<AuditLog, 'id' | 'userId' | 'userDisplayName' | 'timestamp' | 'action'>>) => {
    const user = auth.currentUser;
    if (!user) return; // Don't log actions for unauthenticated users

    try {
        await addDoc(auditLogsCollection, {
            userId: user.uid,
            userDisplayName: user.displayName || user.email,
            action,
            timestamp: serverTimestamp(),
            page: window.location.pathname,
            ...details,
        });
    } catch(e) {
        console.error("Failed to log user action:", e);
        // Do not throw, this is a background task.
    }
};


// --- Page Content ---

export const getContent = async (id: string): Promise<string | { [key: string]: string } | null> => {
  if (!id) return null;
  try {
    const docRef = doc(db, 'content', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  } catch (error) {
    console.error("Error getting content: ", error);
    logError(error, { function: 'getContent', id });
    return null;
  }
}

export const setContent = async (id: string, value: string | { [key: string]: string }): Promise<void> => {
   try {
    const docRef = doc(db, 'content', id);
    await setDoc(docRef, { value });
    await logUserAction('update_content', { targetId: id, changes: { value } });
  } catch (error) {
    console.error("Error setting content: ", error);
    logError(error, { function: 'setContent', id, value });
    throw error;
  }
}


// --- Ceremonies ---

export const seedCeremonies = async () => {
  const initialCeremonies: Omit<Ceremony, 'id'>[] = [
    {
      title: 'Sábado 26 de julio – Guanacaste',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 100000,
      priceType: 'exact',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
      link: 'https://wa.me/50687992560?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2026%20de%20julio%20en%20Guanacaste',
      locationLink: 'https://maps.app.goo.gl/your-location-link',
      featured: false,
      mediaUrl: 'https://streamable.com/e/x6y0g9',
      mediaType: 'video',
      videoFit: 'cover',
      autoplay: true,
      contributionText: 'Puedes reservar con el 20%',
      status: 'active',
      date: '2024-07-26',
      horario: '4:00 p.m. (sábado) – 7:00 a.m. (domingo)⏰',
      registerRequired: false,
      showParticipantCount: false,
      viewCount: 0,
      reserveClickCount: 0,
      whatsappClickCount: 0,
    },
    {
      title: 'Sábado 2 de agosto – San Carlos',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 80000,
      priceType: 'from',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
      link: 'https://wa.me/50687992560?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%202%20de%20agosto%20en%20San%20Carlos',
      locationLink: 'https://maps.app.goo.gl/your-location-link',
      featured: true,
      mediaUrl: 'https://www.tiktok.com/@elartedesanarcr/video/7391992796355153157',
      mediaType: 'video',
      videoFit: 'cover',
      autoplay: false,
      plans: [
        { id: 'plan1', name: 'Plan Básico', price: 80000, description: "Incluye ceremonia y guía." },
        { id: 'plan2', name: 'Plan Completo', price: 100000, priceUntil: 120000, description: "Incluye ceremonia, guía y hospedaje." }
      ],
      contributionText: 'Puedes reservar con el 20%',
      status: 'active',
      date: '2024-08-02',
      horario: '4:00 p.m. (sábado) – 7:00 a.m. (domingo)⏰',
      registerRequired: false,
      showParticipantCount: false,
      viewCount: 0,
      reserveClickCount: 0,
      whatsappClickCount: 0,
    },
    {
      title: 'Transformación Interior',
      description: '“Una experiencia que cambió mi perspectiva por completo.”',
      date: 'Junio 2024',
      mediaType: 'video',
      videoFit: 'cover',
      mediaUrl: 'https://videos.pexels.com/video-files/8086041/8086041-hd_1920_1080_25fps.mp4',
      autoplay: true,
      status: 'finished',
      price: 0,
      priceType: 'exact',
      features: [],
      link: '#',
      featured: false,
      registerRequired: false,
      viewCount: 0,
      reserveClickCount: 0,
      whatsappClickCount: 0,
    },
     {
      title: 'Ceremonia Inactiva de Prueba',
      description: 'Este es un ejemplo de una ceremonia inactiva.',
      date: 'Enero 2024',
      mediaType: 'image',
      videoFit: 'cover',
      mediaUrl: 'https://placehold.co/600x400.png',
      autoplay: false,
      status: 'inactive',
      price: 0,
      priceType: 'exact',
      features: [],
      link: '#',
      featured: false,
      registerRequired: false,
      viewCount: 0,
      reserveClickCount: 0,
      whatsappClickCount: 0,
    },
  ];

  const batch = writeBatch(db);
  initialCeremonies.forEach(ceremony => {
    const docRef = doc(ceremoniesCollection); // Create a new doc with a random ID
    batch.set(docRef, ceremony);
  });
  
  const heroTitleContent = {
    es: 'Un Encuentro Sagrado con Medicinas Ancestrales',
    en: 'A Sacred Encounter with Ancestral Medicines'
  };
  batch.set(doc(contentCollection, 'heroTitle'), { value: heroTitleContent });

  const heroSubtitleContent = {
    es: 'Descubre cómo la Ayahuasca puede transformar tu vida, brindándote claridad, sanación emocional y una renovada conexión con el universo. Únete a nosotros en esta experiencia transformadora, donde la tradición se encuentra con la guía experta para un viaje inolvidable.',
    en: 'Discover how Ayahuasca can transform your life, bringing you clarity, emotional healing, and a renewed connection with the universe. Join us in this transformative experience, where tradition meets expert guidance for an unforgettable journey.'
  };
  batch.set(doc(contentCollection, 'heroSubtitle'), { value: heroSubtitleContent });
  
  const appNameContent = {
    es: 'El Arte de Sanar',
    en: 'The Art of Healing'
  };
  batch.set(doc(contentCollection, 'appName'), { value: appNameContent });


  await batch.commit();
  console.log('Seeded ceremonies data.');
};


export const getCeremonies = async (status?: 'active' | 'finished' | 'inactive'): Promise<Ceremony[]> => {
  try {
    const q = status ? query(ceremoniesCollection, where('status', '==', status)) : query(ceremoniesCollection);
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty && !status) {
        console.log('No ceremonies found, seeding database...');
        await seedCeremonies();
        const newSnapshot = await getDocs(q);
        return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ceremony));
    }

    const ceremoniesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ceremony));

    return ceremoniesData;
  } catch (error) {
    console.error("Error fetching ceremonies: ", error);
    logError(error, { function: 'getCeremonies', status });
    return [];
  }
};

export const getCeremonyById = async (id: string): Promise<Ceremony | null> => {
    try {
        const docRef = doc(db, 'ceremonies', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Ceremony;
        }
        return null;
    } catch (error) {
        console.error("Error getting ceremony by ID: ", error);
        logError(error, { function: 'getCeremonyById', id });
        return null;
    }
}

export const addCeremony = async (ceremony: Omit<Ceremony, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(ceremoniesCollection, {
            ...ceremony,
            viewCount: 0,
            reserveClickCount: 0,
            whatsappClickCount: 0
        });
        await logUserAction('create_ceremony', { targetId: docRef.id, targetType: 'ceremony', changes: ceremony });
        return docRef.id;
    } catch(error) {
        console.error("Error adding ceremony: ", error);
        logError(error, { function: 'addCeremony', ceremony });
        throw error;
    }
}

export const updateCeremony = async (ceremony: Ceremony): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', ceremony.id);
        const { id, ...data } = ceremony;
        await updateDoc(ceremonyRef, data);
        await logUserAction('update_ceremony', { targetId: id, targetType: 'ceremony', changes: data });
    } catch(error) {
        console.error("Error updating ceremony: ", error);
        logError(error, { function: 'updateCeremony', ceremony });
        throw error;
    }
}

export const deleteCeremony = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await deleteDoc(ceremonyRef);
        await logUserAction('delete_ceremony', { targetId: id, targetType: 'ceremony' });
    } catch(error) {
        console.error("Error deleting ceremony: ", error);
        logError(error, { function: 'deleteCeremony', id });
        throw error;
    }
}

// --- Ceremony Analytics ---
export const incrementCeremonyViewCount = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await updateDoc(ceremonyRef, { viewCount: increment(1) });
    } catch (error) {
        // Non-critical, just log it
        console.error("Error incrementing view count:", error);
        logError(error, { function: 'incrementCeremonyViewCount', id });
    }
}

export const incrementCeremonyReserveClick = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await updateDoc(ceremonyRef, { reserveClickCount: increment(1) });
    } catch (error) {
        console.error("Error incrementing reserve click count:", error);
        logError(error, { function: 'incrementCeremonyReserveClick', id });
    }
}

export const incrementCeremonyWhatsappClick = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await updateDoc(ceremonyRef, { whatsappClickCount: increment(1) });
    } catch (error) {
        console.error("Error incrementing whatsapp click count:", error);
        logError(error, { function: 'incrementCeremonyWhatsappClick', id });
    }
}

export const resetCeremonyCounters = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await updateDoc(ceremonyRef, {
            viewCount: 0,
            reserveClickCount: 0,
            whatsappClickCount: 0
        });
        await logUserAction('reset_ceremony_counters', { targetId: id, targetType: 'ceremony' });
    } catch (error) {
        console.error("Error resetting ceremony counters:", error);
        logError(error, { function: 'resetCeremonyCounters', id });
        throw error;
    }
}


// --- Guides ---
export const seedGuides = async () => {
    const initialGuides: Omit<Guide, 'id'>[] = [
        {
            name: 'Wilson Alfaro',
            imageUrl: 'https://i.postimg.cc/k4Dvz2yq/wilson.jpg',
            description: 'guide_desc_wilson_alfaro'
        },
        {
            name: 'Jacob',
            imageUrl: 'https://i.postimg.cc/Qd9yYQ3N/jacob.jpg',
            description: 'guide_desc_jacob'
        },
        {
            name: 'Harley',
            imageUrl: 'https://i.postimg.cc/J0B0f2p9/johanna.jpg',
            description: 'guide_desc_harley'
        },
        {
            name: 'Johanna',
            imageUrl: 'https://i.postimg.cc/mD3mXj50/harley.jpg',
            description: 'guide_desc_johanna'
        },
    ];

    const guideDescriptions: Record<string, { es: string, en: string }> = {
        'guide_desc_wilson_alfaro': {
            es: 'Guía espiritual con profunda conexión con las tradiciones amazónicas. Formado en la Amazonía de perú, Wilson Alfaro aporta un entendimiento ancestral de la Ayahuasca y su poder curativo. Su experiencia facilita un espacio seguro y de confianza para la exploración personal.',
            en: 'Spiritual guide with a deep connection to Amazonian traditions. Trained in the Peruvian Amazon, Wilson Alfaro brings an ancestral understanding of Ayahuasca and its healing power. His experience facilitates a safe and trustworthy space for personal exploration.'
        },
        'guide_desc_jacob': {
            es: 'Maestro espiritual formado en la Amazonía de perú, donde aprendió directamente de curanderos el uso sagrado de la medicina ancestral. Con una presencia serena y profunda, guía ceremonias en Casa Trinitos (Guanacaste), donde acompaña procesos de transformación.',
            en: 'Spiritual master trained in the Peruvian Amazon, where he learned the sacred use of ancestral medicine directly from healers. With a serene and profound presence, he guides ceremonies at Casa Trinitos (Guanacaste), where he accompanies transformation processes.'
        },
        'guide_desc_harley': {
            es: 'Especialista en atención médica y primeros auxilios, con experiencia en meditaciones guiadas y masajes terapéuticos. Su presencia tranquila y profesional garantiza un entorno seguro durante toda la ceremonia, brindando confianza y contención tanto al equipo como a las participantes.',
            en: 'Specialist in medical care and first aid, with experience in guided meditations and therapeutic massages. Her calm and professional presence ensures a safe environment throughout the ceremony, providing confidence and support to both the team and the participants.'
        },
        'guide_desc_johanna': {
            es: 'Guardiana de la medicina formada en la Amazonía de perú. Brindando ceremonias en Colombia y Costa Rica, su presencia aporta seguridad, contención y equilibrio entre lo físico y espiritual, sosteniendo el espacio ceremonial con firmeza, cuidado y profunda conexión con la sanación femenina.',
            en: 'Guardian of the medicine trained in the Peruvian Amazon. Providing ceremonies in Colombia and Costa Rica, her presence brings security, support, and balance between the physical and spiritual, upholding the ceremonial space with firmness, care, and a deep connection to female healing.'
        }
    };
    
    const batch = writeBatch(db);

    for (const guide of initialGuides) {
        const guideDocRef = doc(guidesCollection); // Create a new doc for the guide
        batch.set(guideDocRef, guide);
        
        const descId = guide.description;
        const descContent = guideDescriptions[descId];
        
        if (descContent) {
            const contentDocRef = doc(contentCollection, descId);
            batch.set(contentDocRef, { value: descContent });
        }
    }

    await batch.commit();
    console.log('Seeded guides data.');
}

export const getGuides = async (): Promise<Guide[]> => {
    const guides: Guide[] = [];
    try {
        const snapshot = await getDocs(guidesCollection);
        if (snapshot.empty) {
            await seedGuides();
            const newSnapshot = await getDocs(guidesCollection);
             for (const guideDoc of newSnapshot.docs) {
                guides.push({ id: guideDoc.id, ...guideDoc.data() } as Guide);
            }
            return guides;
        }

        for (const guideDoc of snapshot.docs) {
            guides.push({ id: guideDoc.id, ...guideDoc.data() } as Guide);
        }
        return guides;
    } catch (error) {
        console.error("Error fetching guides: ", error);
        logError(error, { function: 'getGuides' });
        return [];
    }
}


export const updateGuide = async (guide: Guide): Promise<void> => {
    try {
        const guideRef = doc(db, 'guides', guide.id);
        const { id, ...data } = guide; 
        await updateDoc(guideRef, data);
        await logUserAction('update_guide', { targetId: id, targetType: 'guide', changes: data });
    } catch (error) {
        console.error("Error updating guide: ", error);
        logError(error, { function: 'updateGuide', guide });
        throw error;
    }
}

export const deleteGuide = async (id: string): Promise<void> => {
    try {
        const guideRef = doc(db, 'guides', id);
        await deleteDoc(guideRef);
        await logUserAction('delete_guide', { targetId: id, targetType: 'guide' });
    } catch (error) {
        console.error("Error deleting guide: ", error);
        logError(error, { function: 'deleteGuide', id });
        throw error;
    }
};


// --- Firebase Storage ---

export const uploadImage = (file: File, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
        return reject(new Error("No file provided for upload."));
    }
    const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Image upload failed:", error);
        logError(error, { function: 'uploadImage' });
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch(reject);
      }
    );
  });
};

export const uploadVideo = (file: File, onProgress: (progress: number) => void, path: string = 'videos'): Promise<string> => {
  return new Promise((resolve, reject) => {
     if (!file) {
        return reject(new Error("No file provided for upload."));
    }
    const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Video upload failed:", error);
        logError(error, { function: 'uploadVideo' });
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            resolve(downloadURL);
          })
          .catch((error) => {
            console.error("Failed to get download URL:", error);
            logError(error, { function: 'getDownloadURL' });
            reject(error);
          });
      }
    );
  });
};

// --- User Profile ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);

        // Check for audit logs and chats for each user
        const usersWithLogStatus = await Promise.all(
            users.map(async (user) => {
                const hasLogs = await hasAuditLogs(user.uid);
                const hasUserChats = await hasChats(user.uid);
                return { ...user, hasLogs, hasChats: hasUserChats };
            })
        );
        return usersWithLogStatus;
    } catch (error) {
        console.error("Error getting all users:", error);
        logError(error, { function: 'getAllUsers' });
        return [];
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await deleteDoc(userRef);
        await logUserAction('delete_user', { targetId: uid, targetType: 'user' });
    } catch (error) {
        console.error("Error deleting user:", error);
        logError(error, { function: 'deleteUser', uid });
        throw error;
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!uid) return null;
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        logError(error, { function: 'getUserProfile', uid });
        return null;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, data, { merge: true });
        await logUserAction('update_user_profile', { targetId: uid, targetType: 'user', changes: data });
    } catch (error) {
        console.error("Error updating user profile:", error);
        logError(error, { function: 'updateUserProfile', uid, data });
        throw error;
    }
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        const updateData: { role: UserRole, permissions?: UserProfile['permissions'] } = { role };
        if (role !== 'admin' && role !== 'organizer') {
            const currentProfile = await getUserProfile(uid);
            if(currentProfile?.role === 'admin' || currentProfile?.role === 'organizer') {
                updateData.permissions = {}; // Reset permissions
            }
        }
        await updateDoc(userRef, updateData);
        await logUserAction('update_user_role', { targetId: uid, targetType: 'user', changes: { role } });
    } catch (error) {
        console.error("Error updating user role:", error);
        logError(error, { function: 'updateUserRole', uid, role });
        throw error;
    }
};

export const updateUserPermissions = async (uid: string, permission: keyof NonNullable<UserProfile['permissions']>, value: boolean) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            [`permissions.${permission}`]: value
        });
        await logUserAction('update_user_permissions', { targetId: uid, targetType: 'user', changes: { [permission]: value } });
    } catch (error) {
        console.error("Error updating user permissions:", error);
        logError(error, { function: 'updateUserPermissions', uid, permission, value });
        throw error;
    }
};

export const updateUserStatus = async (uid: string, status: UserStatus): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { status });
        await logUserAction('update_user_status', { targetId: uid, targetType: 'user', changes: { status } });
    } catch (error) {
        console.error("Error updating user status:", error);
        logError(error, { function: 'updateUserStatus', uid, status });
        throw error;
    }
};

export const updateUserAssignedCeremonies = async (uid: string, ceremonyIds: string[]): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { assignedCeremonies: ceremonyIds });
        await logUserAction('update_user_ceremonies', { targetId: uid, targetType: 'user', changes: { assignedCeremonies: ceremonyIds } });
    } catch (error) {
        console.error("Error updating assigned ceremonies:", error);
        logError(error, { function: 'updateUserAssignedCeremonies', uid, ceremonyIds });
        throw error;
    }
}

export const getUsersForCeremony = async (ceremonyId: string): Promise<UserProfile[]> => {
    try {
        const q = query(usersCollection, where('assignedCeremonies', 'array-contains', ceremonyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
        console.error(`Error getting users for ceremony ${ceremonyId}:`, error);
        logError(error, { function: 'getUsersForCeremony', ceremonyId });
        return [];
    }
}


// --- Theme Settings ---
export const getThemeSettings = async (): Promise<ThemeSettings | null> => {
    try {
        const docRef = doc(db, 'settings', 'theme');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as ThemeSettings;
        }
        return null;
    } catch (error) {
        console.error("Error getting theme settings:", error);
        logError(error, { function: 'getThemeSettings' });
        return null;
    }
}

export const setThemeSettings = async (settings: ThemeSettings): Promise<void> => {
    try {
        const docRef = doc(db, 'settings', 'theme');
        await setDoc(docRef, settings);
        await logUserAction('update_theme_settings', { changes: settings });
    } catch (error) {
        console.error("Error setting theme settings:", error);
        logError(error, { function: 'setThemeSettings' });
        throw error;
    }
}


// --- Chat ---
export const hasChats = async (userId: string): Promise<boolean> => {
    try {
        const q = query(chatsCollection, where('user.uid', '==', userId), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (e) {
        console.error("Error checking for user chats:", e);
        logError(e, { function: 'hasChats', userId });
        return false;
    }
}

export const saveChatMessage = async (chatId: string, messages: ChatMessage[], user: { uid: string, email: string | null, displayName: string | null } | null) => {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    try {
        if (chatSnap.exists()) {
            await updateDoc(chatRef, {
                messages: messages,
                updatedAt: serverTimestamp(),
            });
        } else {
            await setDoc(chatRef, {
                id: chatId,
                messages: messages,
                user: user,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error("Error saving chat message:", error);
        logError(error, { function: 'saveChatMessage', chatId });
    }
}

export const getChat = async (chatId: string): Promise<Chat | null> => {
    if (!chatId) return null;
    try {
        const docRef = doc(db, 'chats', chatId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Chat;
        }
        return null;
    } catch (error) {
        console.error("Error getting chat:", error);
        logError(error, { function: 'getChat', chatId });
        return null;
    }
};


export const getChatsByUserId = async (userId: string): Promise<Chat[]> => {
    try {
        const q = query(chatsCollection, where('user.uid', '==', userId));
        const snapshot = await getDocs(q);
        const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
        // Sort in-memory to avoid composite index requirement
        chats.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        return chats;
    } catch (error) {
        console.error(`Error getting chats for user ${userId}:`, error);
        logError(error, { function: 'getChatsByUserId', userId });
        return [];
    }
};

export const getAllChats = async (): Promise<Chat[]> => {
    try {
        const q = query(chatsCollection, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
    } catch (error) {
        console.error("Error getting all chats:", error);
        logError(error, { function: 'getAllChats' });
        return [];
    }
};

// --- Questionnaire & Preparation ---

export const saveQuestionnaire = async (uid: string, answers: QuestionnaireAnswers): Promise<void> => {
    const batch = writeBatch(db);

    const dataToSave: Partial<QuestionnaireAnswers> & { uid: string; updatedAt: any } = {
        ...answers,
        uid,
        updatedAt: serverTimestamp(),
    };

    // Remove empty optional fields to avoid Firestore errors
    Object.keys(dataToSave).forEach(key => {
        const typedKey = key as keyof typeof dataToSave;
        if (dataToSave[typedKey] === '' || dataToSave[typedKey] === undefined) {
            delete dataToSave[typedKey];
        }
    });

    const questionnaireRef = doc(db, 'questionnaires', uid);
    batch.set(questionnaireRef, dataToSave, { merge: true });

    const userRef = doc(db, 'users', uid);
    batch.update(userRef, { 
        questionnaireCompleted: true,
        preparationStep: 11 // Set to final step
    });

    try {
        await batch.commit();
        await logUserAction('complete_questionnaire', { targetId: uid, targetType: 'user', changes: dataToSave });
    } catch (error) {
        console.error("Error saving questionnaire and updating user profile:", error);
        logError(error, { function: 'saveQuestionnaire', uid, data: dataToSave });
        throw error;
    }
};

export const getQuestionnaire = async (uid: string): Promise<QuestionnaireAnswers | null> => {
    try {
        const docRef = doc(db, 'questionnaires', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as QuestionnaireAnswers;
        }
        return null;
    } catch (error) {
        console.error("Error getting questionnaire:", error);
        logError(error, { function: 'getQuestionnaire', uid });
        return null;
    }
};

export const updatePreparationProgress = async (uid: string, step: number): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const currentProgress = userDoc.data()?.preparationStep || 0;
            const isCompleted = userDoc.data()?.questionnaireCompleted || false;
            // Only update if the new step is greater and the questionnaire is not yet complete
            if (step > currentProgress && !isCompleted) {
                await updateDoc(userRef, { preparationStep: step });
            }
        }
    } catch (error) {
        console.error("Error updating preparation progress:", error);
        logError(error, { function: 'updatePreparationProgress', uid, step });
        // Do not throw, this is a background update
    }
};

export const resetQuestionnaire = async (uid: string): Promise<void> => {
    const batch = writeBatch(db);

    const questionnaireRef = doc(db, 'questionnaires', uid);
    batch.delete(questionnaireRef);

    const userRef = doc(db, 'users', uid);
    batch.update(userRef, {
        questionnaireCompleted: false,
        preparationStep: 0,
    });

    try {
        await batch.commit();
        await logUserAction('reset_questionnaire', { targetId: uid, targetType: 'user' });
    } catch (error) {
        console.error("Error resetting questionnaire for user:", error);
        logError(error, { function: 'resetQuestionnaire', uid });
        throw error;
    }
};



// --- Error Logs ---
export const getErrorLogs = async (): Promise<ErrorLog[]> => {
    try {
        const q = query(errorLogsCollection, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorLog));
    } catch (error) {
        console.error("Error getting error logs:", error);
        return [];
    }
}

export const getNewErrorLogsCount = async (): Promise<number> => {
    try {
        const q = query(errorLogsCollection, where('status', '==', 'new'));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting new error logs count:", error);
        // Do not log this error to avoid infinite loops if Firestore is the problem
        return 0;
    }
}

export const updateErrorLogStatus = async (id: string, status: 'new' | 'fixed'): Promise<void> => {
    try {
        const logRef = doc(db, 'error_logs', id);
        await updateDoc(logRef, { status });
    } catch (error) {
        console.error("Error updating error log status:", error);
        throw error;
    }
}

export const deleteErrorLog = async (id: string): Promise<void> => {
    try {
        const logRef = doc(db, 'error_logs', id);
        await deleteDoc(logRef);
    } catch (error) {
        console.error("Error deleting error log:", error);
        throw error;
    }
}

export const deleteAllErrorLogs = async (): Promise<void> => {
    try {
        const snapshot = await getDocs(errorLogsCollection);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error deleting all error logs:", error);
        throw error;
    }
}

// --- Invitation Messages ---
export const getInvitationMessages = async (): Promise<InvitationMessage[]> => {
    try {
        const snapshot = await getDocs(invitationMessagesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvitationMessage));
    } catch (error) {
        console.error("Error getting invitation messages:", error);
        logError(error, { function: 'getInvitationMessages' });
        return [];
    }
}

export const addInvitationMessage = async (message: InvitationMessage): Promise<void> => {
    try {
        const docRef = doc(db, 'invitationMessages', message.id);
        await setDoc(docRef, message);
    } catch (error) {
        console.error("Error adding invitation message:", error);
        logError(error, { function: 'addInvitationMessage' });
        throw error;
    }
}

export const updateInvitationMessage = async (message: InvitationMessage): Promise<void> => {
    try {
        const docRef = doc(db, 'invitationMessages', message.id);
        await updateDoc(docRef, message);
    } catch (error) {
        console.error("Error updating invitation message:", error);
        logError(error, { function: 'updateInvitationMessage' });
        throw error;
    }
}

export const deleteInvitationMessage = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, 'invitationMessages', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting invitation message:", error);
        logError(error, { function: 'deleteInvitationMessage' });
        throw error;
    }
}

// --- Ceremony Invitation Messages ---
export const getCeremonyInvitationMessages = async (): Promise<CeremonyInvitationMessage[]> => {
    try {
        const snapshot = await getDocs(ceremonyInvitationMessagesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CeremonyInvitationMessage));
    } catch (error) {
        console.error("Error getting ceremony invitation messages:", error);
        logError(error, { function: 'getCeremonyInvitationMessages' });
        return [];
    }
};

export const addCeremonyInvitationMessage = async (message: CeremonyInvitationMessage): Promise<void> => {
    try {
        const docRef = doc(db, 'ceremonyInvitationMessages', message.id);
        await setDoc(docRef, message);
    } catch (error) {
        console.error("Error adding ceremony invitation message:", error);
        logError(error, { function: 'addCeremonyInvitationMessage' });
        throw error;
    }
};

export const updateCeremonyInvitationMessage = async (message: CeremonyInvitationMessage): Promise<void> => {
    try {
        const docRef = doc(db, 'ceremonyInvitationMessages', message.id);
        await updateDoc(docRef, message);
    } catch (error) {
        console.error("Error updating ceremony invitation message:", error);
        logError(error, { function: 'updateCeremonyInvitationMessage' });
        throw error;
    }
};

export const deleteCeremonyInvitationMessage = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, 'ceremonyInvitationMessages', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting ceremony invitation message:", error);
        logError(error, { function: 'deleteCeremonyInvitationMessage' });
        throw error;
    }
};


// --- Backup & Restore ---
export const exportAllData = async (): Promise<BackupData> => {
  const usersSnapshot = await getDocs(usersCollection);
  const users = usersSnapshot.docs.map(d => d.data() as UserProfile);

  const ceremoniesSnapshot = await getDocs(ceremoniesCollection);
  const ceremonies = ceremoniesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Ceremony));

  const guidesSnapshot = await getDocs(guidesCollection);
  const guides = guidesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Guide));

  const contentSnapshot = await getDocs(contentCollection);
  const content = contentSnapshot.docs.map(d => ({ id: d.id, value: d.data().value }));

  const settingsSnapshot = await getDocs(settingsCollection);
  const settings = settingsSnapshot.docs.map(d => ({ id: d.id, value: d.data() }));

  return { users, ceremonies, guides, content, settings };
};

export const importAllData = async (data: BackupData): Promise<void> => {
  const batch = writeBatch(db);

  // Clear existing data (optional, but recommended for a clean import)
  // Note: This is a destructive action. Consider your use case.
  // For this implementation, we will overwrite based on IDs.

  data.users.forEach(user => {
    const docRef = doc(db, 'users', user.uid);
    batch.set(docRef, user);
  });

  data.ceremonies.forEach(ceremony => {
    const docRef = doc(db, 'ceremonies', ceremony.id);
    const { id, ...ceremonyData } = ceremony;
    batch.set(docRef, ceremonyData);
  });
  
  data.guides.forEach(guide => {
    const docRef = doc(db, 'guides', guide.id);
    const { id, ...guideData } = guide;
    batch.set(docRef, guideData);
  });
  
  data.content.forEach(contentItem => {
    const docRef = doc(db, 'content', contentItem.id);
    batch.set(docRef, { value: contentItem.value });
  });

  data.settings.forEach(setting => {
    const docRef = doc(db, 'settings', setting.id);
    batch.set(docRef, setting.value);
  });

  await batch.commit();
};

// --- Analytics ---
export const logSectionClick = async (sectionId: string, userId?: string): Promise<void> => {
  try {
    await addDoc(analyticsCollection, {
      sectionId,
      userId: userId || 'anonymous',
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error logging click for section ${sectionId}:`, error);
    // Don't throw, as this is a background task
  }
};

export const getSectionAnalytics = async (): Promise<SectionAnalytics[]> => {
  try {
    const snapshot = await getDocs(analyticsCollection);
    const logs = snapshot.docs.map(doc => doc.data() as SectionClickLog);

    const counts = logs.reduce((acc, log) => {
      acc[log.sectionId] = (acc[log.sectionId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analyticsData = Object.entries(counts).map(([sectionId, clickCount]) => ({
      sectionId,
      clickCount,
    }));

    analyticsData.sort((a, b) => b.clickCount - a.clickCount);

    return analyticsData;
  } catch (error) {
    console.error("Error getting section analytics:", error);
    logError(error, { function: 'getSectionAnalytics' });
    return [];
  }
};

export const resetSectionAnalytics = async (): Promise<void> => {
    try {
        const snapshot = await getDocs(analyticsCollection);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error resetting section analytics:", error);
        logError(error, { function: 'resetSectionAnalytics' });
        throw error;
    }
}

// --- Courses ---

export const getCourses = async (): Promise<Course[]> => {
    try {
        const q = query(coursesCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
        console.error("Error getting courses:", error);
        logError(error, { function: 'getCourses' });
        return [];
    }
}

export const addCourse = async (course: Omit<Course, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const docRef = await addDoc(coursesCollection, {
            ...course,
            createdAt: serverTimestamp(),
        });
        await logUserAction('create_course', { targetId: docRef.id, targetType: 'course', changes: course });
        return docRef.id;
    } catch(error) {
        console.error("Error adding course: ", error);
        logError(error, { function: 'addCourse', course });
        throw error;
    }
}

export const updateCourse = async (course: Course): Promise<void> => {
    try {
        const courseRef = doc(db, 'courses', course.id);
        const { id, ...data } = course;
        await updateDoc(courseRef, data);
        await logUserAction('update_course', { targetId: id, targetType: 'course', changes: data });
    } catch(error) {
        console.error("Error updating course: ", error);
        logError(error, { function: 'updateCourse', course });
        throw error;
    }
}

export const deleteCourse = async (id: string): Promise<void> => {
    try {
        const courseRef = doc(db, 'courses', id);
        await deleteDoc(courseRef);
        await logUserAction('delete_course', { targetId: id, targetType: 'course' });
    } catch(error) {
        console.error("Error deleting course: ", error);
        logError(error, { function: 'deleteCourse', id });
        throw error;
    }
}

export const updateUserCompletedCourses = async (uid: string, courseId: string, isCompleted: boolean): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        if (isCompleted) {
            await updateDoc(userRef, { completedCourses: arrayUnion(courseId) });
        } else {
            await updateDoc(userRef, { completedCourses: arrayRemove(courseId) });
        }
    } catch (error) {
        console.error("Error updating completed courses:", error);
        logError(error, { function: 'updateUserCompletedCourses', uid, courseId, isCompleted });
        throw error;
    }
}

export const updateVideoProgress = async (uid: string, videoId: string, time: number): Promise<void> => {
    try {
        const progressRef = doc(db, `users/${uid}/videoProgress`, videoId);
        await setDoc(progressRef, { time, updatedAt: serverTimestamp() });
    } catch (error) {
        console.error("Error updating video progress:", error);
        logError(error, { function: 'updateVideoProgress', uid, videoId, time });
    }
};

export const getVideoProgress = async (uid: string, videoId: string): Promise<number | null> => {
    try {
        const progressRef = doc(db, `users/${uid}/videoProgress`, videoId);
        const docSnap = await getDoc(progressRef);
        if (docSnap.exists()) {
            return docSnap.data().time;
        }
        return null;
    } catch (error) {
        console.error("Error getting video progress:", error);
        logError(error, { function: 'getVideoProgress', uid, videoId });
        return null;
    }
};

// --- Audit Logs ---
export const hasAuditLogs = async (userId: string): Promise<boolean> => {
    try {
        const q = query(auditLogsCollection, where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (e) {
        console.error("Error checking for audit logs:", e);
        logError(e, { function: 'hasAuditLogs', userId });
        return false;
    }
}

export const getAuditLogsForUser = async (userId: string): Promise<AuditLog[]> => {
    try {
        const q = query(auditLogsCollection, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
        
        // Sort in-memory to avoid composite index
        logs.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

        return logs;
    } catch(e) {
        console.error("Error fetching audit logs:", e);
        logError(e, { function: 'getAuditLogsForUser', userId });
        return [];
    }
}

// --- Testimonials ---
export const addTestimonial = async (testimonial: Omit<Testimonial, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(testimonialsCollection, testimonial);
        return docRef.id;
    } catch (error) {
        console.error("Error adding testimonial:", error);
        logError(error, { function: 'addTestimonial' });
        throw error;
    }
};

export const getTestimonialsByCeremonyId = async (ceremonyId: string): Promise<Testimonial[]> => {
    try {
        const q = query(
            testimonialsCollection,
            where('ceremonyId', '==', ceremonyId),
            where('consent', '==', true),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        logError(error, { function: 'getTestimonialsByCeremonyId', ceremonyId });
        return [];
    }
};

export const getPublicTestimonials = async (): Promise<Testimonial[]> => {
    try {
        const q = query(
            testimonialsCollection,
            where('consent', '==', true),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
    } catch (error) {
        console.error("Error fetching public testimonials:", error);
        logError(error, { function: 'getPublicTestimonials' });
        return [];
    }
};


export type { Chat };
export type { UserProfile };

  
