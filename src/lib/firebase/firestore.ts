

import { collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc, getDoc, query, serverTimestamp, writeBatch, where, orderBy, increment, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { db, storage } from './config';
import type { Ceremony, Guide, UserProfile, ThemeSettings, Chat, ChatMessage, QuestionnaireAnswers, UserStatus, ErrorLog, InvitationMessage, BackupData, SectionClickLog, SectionAnalytics, Course, VideoProgress, UserRole, AuditLog, CeremonyInvitationMessage, Testimonial, ShareMemoryMessage, EnvironmentSettings, PredefinedTheme, DreamEntry } from '@/types';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth } from './config';
import { v4 as uuidv4 } from 'uuid';
import { getSystemEnvironment } from '@/ai/flows/settings-flow';

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
const shareMemoryMessagesCollection = collection(db, 'shareMemoryMessages');
const analyticsCollection = collection(db, 'analytics');
const coursesCollection = collection(db, 'courses');
const auditLogsCollection = collection(db, 'audit_logs');
const testimonialsCollection = collection(db, 'testimonials');
const predefinedThemesCollection = collection(db, 'predefinedThemes');


export const logError = (error: any, context?: Record<string, any>) => {
    try {
        const cleanContext = context ? JSON.parse(JSON.stringify(context, (key, value) => 
            value === undefined ? null : value
        )) : {};
        
        addDoc(errorLogsCollection, {
            message: error.message,
            stack: error.stack,
            context: cleanContext || {},
            timestamp: serverTimestamp(),
            status: 'new'
        });
    } catch (e) {
        console.error("Failed to log error to Firestore:", e);
    }
};

export const logUserAction = async (action: string, details?: Partial<Omit<AuditLog, 'id' | 'userId' | 'userDisplayName' | 'timestamp' | 'action'>>) => {
    const user = auth.currentUser;
    // Allow logging for anonymous users only for specific, safe actions
    if (!user) {
        if (action === 'view_ceremony' || action === 'play_video') {
            // Proceed with logging for anonymous users
        } else {
            return;
        }
    }

    try {
        await addDoc(auditLogsCollection, {
            userId: user?.uid || 'anonymous',
            userDisplayName: user?.displayName || user?.email || 'anonymous',
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
export const getAllContent = async (): Promise<{ id: string; value: any }[]> => {
    try {
        const snapshot = await getDocs(contentCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, value: doc.data().value }));
    } catch (error) {
        console.error("Error getting all content:", error);
        logError(error, { function: 'getAllContent' });
        return [];
    }
};

export const getContent = async (id: string): Promise<string | { [key: string]: string } | null> => {
  if (!id) return null;
  try {
    const docRef = doc(db, 'content', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  } catch (error: any) {
    if (error.code === 'unavailable') {
        console.warn(`Could not fetch content for id "${id}" while offline. Returning null.`);
        return null;
    }
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
      slug: 'sabado-26-de-julio-guanacaste',
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
      slug: 'sabado-2-de-agosto--san-carlos',
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
      slug: 'transformacion-interior',
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
      slug: 'ceremonia-inactiva-de-prueba',
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

export const getCeremonyById = async (idOrSlug: string): Promise<Ceremony | null> => {
    try {
        // First, try to fetch by direct ID match, which is the most reliable.
        const docRef = doc(db, 'ceremonies', idOrSlug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Ceremony;
        }

        // If not found by ID, query by slug. This handles cases where the URL uses the slug.
        const q = query(collection(db, "ceremonies"), where('slug', '==', idOrSlug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // If multiple ceremonies have the same slug, return the most recent one.
            const ceremonies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ceremony));
             ceremonies.sort((a, b) => {
                const dateA = a.date ? new Date(a.date.split(' de ')[2], new Date(`${a.date.split(' de ')[1]} 1, 2000`).getMonth(), a.date.split(' de ')[0]) : new Date(0);
                const dateB = b.date ? new Date(b.date.split(' de ')[2], new Date(`${b.date.split(' de ')[1]} 1, 2000`).getMonth(), b.date.split(' de ')[0]) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            return ceremonies[0];
        }

        return null;
    } catch (error: any) {
        if (error.code === 'unavailable') {
            console.warn(`Could not fetch ceremony by id "${idOrSlug}" while offline. Returning null.`);
            return null;
        }
        console.error("Error getting ceremony by ID or slug: ", error);
        logError(error, { function: 'getCeremonyById', idOrSlug });
        return null;
    }
}

export const addCeremony = async (ceremony: Omit<Ceremony, 'id'>): Promise<string> => {
    try {
        const newCeremony = {
            ...ceremony,
            viewCount: 0,
            reserveClickCount: 0,
            whatsappClickCount: 0,
            downloadCount: 0,
        };
        const docRef = await addDoc(ceremoniesCollection, newCeremony);
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
        // Firestore cannot store undefined values.
        const cleanData = JSON.parse(JSON.stringify(data, (key, value) => 
            value === undefined ? null : value
        ));
        await updateDoc(ceremonyRef, cleanData);
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
        // This is a non-critical action that might fail due to permissions for anonymous users.
        // We log it for debugging but don't re-throw to avoid breaking the user experience.
        logError(error, { function: 'incrementCeremonyViewCount', id, message: "This can happen for anonymous users and is expected." });
    }
}

export const incrementCeremonyDownloadCount = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await updateDoc(ceremonyRef, { downloadCount: increment(1) });
    } catch (error) {
        console.error("Error incrementing download count:", error);
        logError(error, { function: 'incrementCeremonyDownloadCount', id });
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
export const uploadMedia = (file: File, onProgress: (progress: number) => void, path: string): Promise<string> => {
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
                console.error("Upload failed:", error);
                logError(error, { function: 'uploadMedia', path });
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
            }
        );
    });
};

export const uploadImage = (file: File, onProgress: (progress: number) => void): Promise<string> => {
  return uploadMedia(file, onProgress, 'images');
};

export const uploadVideo = (file: File, onProgress: (progress: number) => void, path: string = 'videos'): Promise<string> => {
  return uploadMedia(file, onProgress, path);
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
    } catch (error: any) {
        if (error.code === 'unavailable') {
            console.warn(`Could not fetch user profile for uid "${uid}" while offline. Returning null.`);
            return null;
        }
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

export const updateUserLanguage = async (uid: string, language: 'es' | 'en'): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { language });
        // Not logging this action to avoid feedback loops if called from other loggable actions
    } catch (error) {
        console.error("Error updating user language:", error);
        logError(error, { function: 'updateUserLanguage', uid, language });
        throw error;
    }
}


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

export const updateUserAssignedCeremonies = async (uid: string, ceremonyIds: (string | { ceremonyId: string; planId: string })[]): Promise<void> => {
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

export const assignCeremonyToUser = async (uid: string, ceremonyId: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { assignedCeremonies: arrayUnion(ceremonyId) });
        await logUserAction('assign_ceremony_to_user', { targetId: uid, targetType: 'user', changes: { ceremonyId } });
    } catch (error) {
        console.error(`Error assigning ceremony ${ceremonyId} to user ${uid}:`, error);
        logError(error, { function: 'assignCeremonyToUser', uid, ceremonyId });
        throw error;
    }
};


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
            return docSnap.data().value as ThemeSettings;
        }
        return null;
    } catch (error: any) {
        if (error.code === 'unavailable') {
            console.warn(`Could not fetch theme settings while offline. Returning null.`);
            return null;
        }
        console.error("Error getting theme settings:", error);
        logError(error, { function: 'getThemeSettings' });
        return null;
    }
}

export const setThemeSettings = async (settings: ThemeSettings): Promise<void> => {
    try {
        const docRef = doc(db, 'settings', 'theme');
        await setDoc(docRef, { value: settings });
        await logUserAction('update_theme_settings', { changes: settings });
    } catch (error) {
        console.error("Error setting theme settings:", error);
        logError(error, { function: 'setThemeSettings' });
        throw error;
    }
}

export const seedPredefinedThemes = async (): Promise<PredefinedTheme[]> => {
  const initialThemes: PredefinedTheme[] = [
    { id: 'default', name: 'Default', colors: { light: { background: '40 33% 98%', foreground: '20 14.3% 4.1%', card: '40 33% 98%', cardForeground: '20 14.3% 4.1%', popover: '40 33% 98%', popoverForeground: '20 14.3% 4.1%', primary: '125 33% 74%', primaryForeground: '125 33% 10%', secondary: '210 40% 96.1%', secondaryForeground: '222.2 47.4% 11.2%', muted: '210 40% 96.1%', mutedForeground: '215.4 16.3% 46.9%', accent: '47 62% 52%', accentForeground: '47 62% 5%', destructive: '0 84.2% 60.2%', destructiveForeground: '210 40% 98%', border: '214.3 31.8% 91.4%', input: '214.3 31.8% 91.4%', ring: '125 33% 74%', }, dark: { background: '140 15% 5%', foreground: '140 5% 95%', card: '140 10% 8%', cardForeground: '140 5% 95%', popover: '140 10% 8%', popoverForeground: '140 5% 95%', primary: '150 40% 45%', primaryForeground: '150 40% 95%', secondary: '140 10% 12%', secondaryForeground: '140 5% 95%', muted: '140 10% 12%', mutedForeground: '140 5% 64.9%', accent: '140 10% 15%', accentForeground: '140 5% 95%', destructive: '0 63% 31%', destructiveForeground: '0 0% 95%', border: '140 10% 15%', input: '140 10% 15%', ring: '150 40% 45%', } } },
    { id: 'sunset', name: 'Sunset', colors: { light: { background: '30 100% 97%', foreground: '20 15% 20%', primary: '15 90% 65%', primaryForeground: '0 0% 100%', secondary: '30 90% 90%', secondaryForeground: '20 15% 20%', muted: '30 90% 90%', mutedForeground: '20 15% 40%', accent: '330 80% 70%', accentForeground: '330 20% 15%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '30 50% 85%', input: '30 50% 85%', ring: '15 90% 65%', card: '30 100% 97%', cardForeground: '20 15% 20%', popover: '30 100% 97%', popoverForeground: '20 15% 20%' }, dark: { background: '270 50% 15%', foreground: '300 30% 95%', primary: '35 90% 60%', primaryForeground: '20 20% 5%', secondary: '260 40% 20%', secondaryForeground: '300 30% 95%', muted: '260 40% 20%', mutedForeground: '300 30% 70%', accent: '350 90% 65%', accentForeground: '350 20% 10%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '260 40% 25%', input: '260 40% 25%', ring: '35 90% 60%', card: '270 50% 15%', cardForeground: '300 30% 95%', popover: '270 50% 15%', popoverForeground: '300 30% 95%' } } },
    { id: 'oceanic', name: 'Oceanic', colors: { light: { background: '210 100% 98%', foreground: '220 40% 10%', primary: '200 80% 60%', primaryForeground: '220 50% 5%', secondary: '210 90% 90%', secondaryForeground: '220 40% 10%', muted: '210 90% 90%', mutedForeground: '215 20% 45%', accent: '190 70% 75%', accentForeground: '190 30% 15%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '210 50% 85%', input: '210 50% 85%', ring: '200 80% 60%', card: '210 100% 98%', cardForeground: '220 40% 10%', popover: '210 100% 98%', popoverForeground: '220 40% 10%' }, dark: { background: '220 40% 5%', foreground: '210 30% 95%', primary: '190 70% 55%', primaryForeground: '190 20% 10%', secondary: '220 40% 12%', secondaryForeground: '210 30% 95%', muted: '220 40% 12%', mutedForeground: '210 30% 70%', accent: '200 80% 60%', accentForeground: '200 20% 5%', destructive: '0 63% 31%', destructiveForeground: '0 0% 100%', border: '220 40% 15%', input: '220 40% 15%', ring: '190 70% 55%', card: '220 40% 8%', cardForeground: '210 30% 95%', popover: '220 40% 8%', popoverForeground: '210 30% 95%' } } },
    { id: 'forest', name: 'Forest', colors: { light: { background: '110 30% 97%', foreground: '120 25% 15%', primary: '120 40% 40%', primaryForeground: '110 50% 98%', secondary: '110 20% 90%', secondaryForeground: '120 25% 15%', muted: '110 20% 90%', mutedForeground: '120 15% 40%', accent: '100 35% 60%', accentForeground: '100 20% 10%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '110 20% 85%', input: '110 20% 85%', ring: '120 40% 40%', card: '110 30% 97%', cardForeground: '120 25% 15%', popover: '110 30% 97%', popoverForeground: '120 25% 15%' }, dark: { background: '120 25% 8%', foreground: '110 30% 95%', primary: '110 35% 55%', primaryForeground: '110 15% 10%', secondary: '120 20% 12%', secondaryForeground: '110 30% 95%', muted: '120 20% 12%', mutedForeground: '110 30% 70%', accent: '90 40% 50%', accentForeground: '90 15% 95%', destructive: '0 70% 40%', destructiveForeground: '0 0% 100%', border: '120 20% 15%', input: '120 20% 15%', ring: '110 35% 55%', card: '120 25% 10%', cardForeground: '110 30% 95%', popover: '120 25% 10%', popoverForeground: '110 30% 95%' } } },
    { id: 'slate', name: 'Slate', colors: { light: { background: '220 20% 98%', foreground: '220 15% 20%', primary: '225 30% 50%', primaryForeground: '220 30% 98%', secondary: '220 15% 94%', secondaryForeground: '220 15% 20%', muted: '220 15% 94%', mutedForeground: '220 10% 45%', accent: '215 25% 65%', accentForeground: '215 20% 10%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '220 15% 88%', input: '220 15% 88%', ring: '225 30% 50%', card: '220 20% 98%', cardForeground: '220 15% 20%', popover: '220 20% 98%', popoverForeground: '220 15% 20%' }, dark: { background: '220 15% 10%', foreground: '210 20% 95%', primary: '215 25% 55%', primaryForeground: '215 15% 98%', secondary: '220 15% 15%', secondaryForeground: '210 20% 95%', muted: '220 15% 15%', mutedForeground: '210 20% 70%', accent: '225 30% 40%', accentForeground: '225 15% 95%', destructive: '0 63% 31%', destructiveForeground: '0 0% 100%', border: '220 15% 20%', input: '220 15% 20%', ring: '215 25% 55%', card: '220 15% 12%', cardForeground: '210 20% 95%', popover: '220 15% 12%', popoverForeground: '210 20% 95%' } } },
  ];
  const batch = writeBatch(db);
  initialThemes.forEach(theme => {
    const docRef = doc(predefinedThemesCollection, theme.id);
    batch.set(docRef, theme);
  });
  await batch.commit();
  console.log('Seeded predefined themes.');
  return initialThemes;
};

export const getPredefinedThemes = async (): Promise<PredefinedTheme[]> => {
    try {
        const snapshot = await getDocs(predefinedThemesCollection);
        if (snapshot.empty) {
          return await seedPredefinedThemes();
        }
        return snapshot.docs.map(doc => doc.data() as PredefinedTheme);
    } catch (error) {
        console.error("Error getting predefined themes:", error);
        logError(error, { function: 'getPredefinedThemes' });
        return [];
    }
};

export const savePredefinedTheme = async (theme: PredefinedTheme): Promise<void> => {
    try {
        const docRef = doc(db, 'predefinedThemes', theme.id);
        await setDoc(docRef, theme);
        await logUserAction('save_predefined_theme', { targetId: theme.id, changes: { name: theme.name } });
    } catch (error) {
        console.error("Error saving predefined theme:", error);
        logError(error, { function: 'savePredefinedTheme' });
        throw error;
    }
};

export const deletePredefinedTheme = async (themeId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'predefinedThemes', themeId);
        await deleteDoc(docRef);
        await logUserAction('delete_predefined_theme', { targetId: themeId });
    } catch (error) {
        console.error("Error deleting predefined theme:", error);
        logError(error, { function: 'deletePredefinedTheme' });
        throw error;
    }
};



// --- Chat ---
export const hasChats = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
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
    } catch (error: any) {
        if (error.code === 'unavailable') {
            console.warn(`Could not fetch chat for id "${chatId}" while offline. Returning null.`);
            return null;
        }
        console.error("Error getting chat:", error);
        logError(error, { function: 'getChat', chatId });
        return null;
    }
};


export const getChatsByUserId = async (userId: string): Promise<Chat[]> => {
    if (!userId) {
        console.warn("getChatsByUserId called with invalid userId. Returning empty array.");
        return [];
    }
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
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Manually convert Firestore Timestamp to JS Date
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
            return { id: doc.id, ...data, createdAt, updatedAt } as Chat;
        });
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
    } catch (error: any) {
        if (error.code === 'unavailable') {
            console.warn(`Could not fetch questionnaire for uid "${uid}" while offline. Returning null.`);
            return null;
        }
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

// --- Share Memory Messages ---
export const getShareMemoryMessages = async (): Promise<ShareMemoryMessage[]> => {
    try {
        const snapshot = await getDocs(shareMemoryMessagesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShareMemoryMessage));
    } catch (error) {
        console.error("Error getting share memory messages:", error);
        logError(error, { function: 'getShareMemoryMessages' });
        return [];
    }
};

export const addShareMemoryMessage = async (message: ShareMemoryMessage): Promise<void> => {
    try {
        const docRef = doc(db, 'shareMemoryMessages', message.id);
        await setDoc(docRef, message);
    } catch (error) {
        console.error("Error adding share memory message:", error);
        logError(error, { function: 'addShareMemoryMessage' });
        throw error;
    }
};

export const updateShareMemoryMessage = async (message: ShareMemoryMessage): Promise<void> => {
    try {
        const docRef = doc(db, 'shareMemoryMessages', message.id);
        await updateDoc(docRef, message);
    } catch (error) {
        console.error("Error updating share memory message:", error);
        logError(error, { function: 'updateShareMemoryMessage' });
        throw error;
    }
};

export const deleteShareMemoryMessage = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, 'shareMemoryMessages', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting share memory message:", error);
        logError(error, { function: 'deleteShareMemoryMessage' });
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
  
  const coursesSnapshot = await getDocs(coursesCollection);
  const courses = coursesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course));
  
  const testimonialsSnapshot = await getDocs(testimonialsCollection);
  const testimonials = testimonialsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
  
  const invitationMessagesSnapshot = await getDocs(invitationMessagesCollection);
  const invitationMessages = invitationMessagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as InvitationMessage));
  
  const ceremonyInvitationMessagesSnapshot = await getDocs(ceremonyInvitationMessagesCollection);
  const ceremonyInvitationMessages = ceremonyInvitationMessagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CeremonyInvitationMessage));
  
  const shareMemoryMessagesSnapshot = await getDocs(shareMemoryMessagesCollection);
  const shareMemoryMessages = shareMemoryMessagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShareMemoryMessage));

  const environments = await getSystemEnvironment();

  const questionnairesSnapshot = await getDocs(questionnairesCollection);
  const questionnaires = questionnairesSnapshot.docs.map(d => ({ ...d.data() as QuestionnaireAnswers, uid: d.id }));

  const chatsSnapshot = await getDocs(chatsCollection);
  const chats = chatsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
  
  const predefinedThemesSnapshot = await getDocs(predefinedThemesCollection);
  const predefinedThemes = predefinedThemesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as PredefinedTheme));

  return { 
    users, 
    ceremonies, 
    guides, 
    content, 
    settings,
    courses,
    testimonials,
    invitationMessages,
    ceremonyInvitationMessages,
    shareMemoryMessages,
    environments,
    questionnaires,
    chats,
    predefinedThemes,
  };
};

export const importAllData = async (data: BackupData): Promise<void> => {
    const batch = writeBatch(db);

    const deleteCollection = async (coll: any) => {
        const snapshot = await getDocs(coll);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    // Clear collections that are fully replaced
    await Promise.all([
        deleteCollection(invitationMessagesCollection),
        deleteCollection(ceremonyInvitationMessagesCollection),
        deleteCollection(shareMemoryMessagesCollection),
        deleteCollection(questionnairesCollection),
        deleteCollection(chatsCollection),
        deleteCollection(predefinedThemesCollection),
    ]);


    // Overwrite data based on IDs
    if (data.users) {
        data.users.forEach(user => {
            if (user && user.uid) {
                const docRef = doc(db, 'users', user.uid);
                batch.set(docRef, user);
            }
        });
    }

    if (data.ceremonies) {
        data.ceremonies.forEach(ceremony => {
            if (ceremony && ceremony.id) {
                const docRef = doc(db, 'ceremonies', ceremony.id);
                const { id, ...ceremonyData } = ceremony;
                batch.set(docRef, ceremonyData);
            }
        });
    }
    
    if (data.guides) {
        data.guides.forEach(guide => {
            if (guide && guide.id) {
                const docRef = doc(db, 'guides', guide.id);
                const { id, ...guideData } = guide;
                batch.set(docRef, guideData);
            }
        });
    }
    
    if (data.content) {
        data.content.forEach(contentItem => {
            if (contentItem && contentItem.id) {
                const docRef = doc(db, 'content', contentItem.id);
                batch.set(docRef, { value: contentItem.value });
            }
        });
    }

    if (data.settings) {
        data.settings.forEach(setting => {
            if (setting && setting.id) {
                const docRef = doc(db, 'settings', setting.id);
                batch.set(docRef, setting.value);
            }
        });
    }
    
    if (data.courses) {
        data.courses.forEach(course => {
            if (course && course.id) {
                const docRef = doc(db, 'courses', course.id);
                const { id, ...courseData } = course;
                batch.set(docRef, courseData);
            }
        });
    }

    if (data.testimonials) {
        data.testimonials.forEach(testimonial => {
            if (testimonial && testimonial.id) {
                const docRef = doc(db, 'testimonials', testimonial.id);
                const { id, ...testimonialData } = testimonial;
                batch.set(docRef, testimonialData);
            }
        });
    }

    if (data.invitationMessages) {
        data.invitationMessages.forEach(msg => {
            if (msg && msg.id) {
                const docRef = doc(db, 'invitationMessages', msg.id);
                batch.set(docRef, msg);
            }
        });
    }

    if (data.ceremonyInvitationMessages) {
        data.ceremonyInvitationMessages.forEach(msg => {
            if (msg && msg.id) {
                const docRef = doc(db, 'ceremonyInvitationMessages', msg.id);
                batch.set(docRef, msg);
            }
        });
    }

    if (data.shareMemoryMessages) {
        data.shareMemoryMessages.forEach(msg => {
            if (msg && msg.id) {
                const docRef = doc(db, 'shareMemoryMessages', msg.id);
                batch.set(docRef, msg);
            }
        });
    }

    if (data.environments) {
        const envDocRef = doc(db, 'settings', 'environment');
        batch.set(envDocRef, data.environments);
    }
    
    if (data.questionnaires) {
        data.questionnaires.forEach(q => {
            if (q && q.uid) { // Questionnaires are keyed by uid
                const docRef = doc(db, 'questionnaires', q.uid);
                batch.set(docRef, q);
            }
        });
    }
    
    if (data.chats) {
        data.chats.forEach(chat => {
            if (chat && chat.id) {
                const docRef = doc(db, 'chats', chat.id);
                batch.set(docRef, chat);
            }
        });
    }

    if (data.predefinedThemes) {
        data.predefinedThemes.forEach(theme => {
            if (theme && theme.id) {
                const docRef = doc(db, 'predefinedThemes', theme.id);
                batch.set(docRef, theme);
            }
        });
    }


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
    logError(error, { function: 'logSectionClick', sectionId, userId });
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
    if (!userId) return false;
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

export const deleteAllAuditLogs = async (): Promise<void> => {
    try {
        const snapshot = await getDocs(auditLogsCollection);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await logUserAction('delete_all_audit_logs');
    } catch (error) {
        console.error("Error deleting all audit logs:", error);
        logError(error, { function: 'deleteAllAuditLogs' });
        throw error;
    }
}

// --- Testimonials ---
export const addTestimonial = async (testimonial: Omit<Testimonial, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(testimonialsCollection, { ...testimonial, isPublic: false });
        return docRef.id;
    } catch (error) {
        console.error("Error adding testimonial:", error);
        logError(error, { function: 'addTestimonial' });
        throw error;
    }
};

export const updateTestimonialPublicStatus = async (id: string, isPublic: boolean): Promise<void> => {
    try {
        const testimonialRef = doc(db, 'testimonials', id);
        await updateDoc(testimonialRef, { isPublic });
        await logUserAction('update_testimonial_status', { targetId: id, targetType: 'testimonial', changes: { isPublic } });
    } catch(error) {
        console.error("Error updating testimonial status: ", error);
        logError(error, { function: 'updateTestimonialPublicStatus', id, isPublic });
        throw error;
    }
};

export const deleteTestimonial = async (id: string): Promise<void> => {
    try {
        const testimonialRef = doc(db, 'testimonials', id);
        await deleteDoc(testimonialRef);
        await logUserAction('delete_testimonial', { targetId: id, targetType: 'testimonial' });
    } catch(error) {
        console.error("Error deleting testimonial: ", error);
        logError(error, { function: 'deleteTestimonial', id });
        throw error;
    }
};

export const getTestimonialsByCeremonyId = async (ceremonyId: string): Promise<Testimonial[]> => {
    try {
        const q = query(
            testimonialsCollection,
            where('ceremonyId', '==', ceremonyId),
            where('isPublic', '==', true),
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

export const getAllTestimonialsForAdmin = async (): Promise<Testimonial[]> => {
    try {
        const q = query(testimonialsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            return { id: doc.id, ...data, createdAt } as Testimonial
        });
    } catch (error) {
        console.error("Error fetching all testimonials for admin:", error);
        logError(error, { function: 'getAllTestimonialsForAdmin' });
        return [];
    }
}

export const getPublicTestimonials = async (): Promise<Testimonial[]> => {
    try {
        const q = query(
            testimonialsCollection,
            where('isPublic', '==', true)
        );
        const snapshot = await getDocs(q);
        const testimonials = snapshot.docs.map(doc => {
            const data = doc.data();
            // Manually convert Firestore Timestamp to JS Date
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            return { id: doc.id, ...data, createdAt } as Testimonial
        });
        
        // Sort in-memory to avoid composite index
        testimonials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return testimonials;
    } catch (error) {
        console.error("Error fetching public testimonials:", error);
        logError(error, { function: 'getPublicTestimonials' });
        return [];
    }
};

// --- Dream Journal ---
export const saveDreamEntry = async (uid: string, entry: DreamEntry): Promise<void> => {
    try {
        const dreamJournalCollection = collection(db, `users/${uid}/dreamJournal`);
        await addDoc(dreamJournalCollection, entry);
    } catch (error) {
        console.error("Error saving dream entry:", error);
        logError(error, { function: 'saveDreamEntry', uid });
        throw error;
    }
};

export const getDreamEntries = async (uid: string): Promise<DreamEntry[]> => {
    if (!uid) return [];
    try {
        const dreamJournalCollection = collection(db, `users/${uid}/dreamJournal`);
        const q = query(dreamJournalCollection, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as DreamEntry;
        });
    } catch (error) {
        console.error("Error getting dream entries:", error);
        logError(error, { function: 'getDreamEntries', uid });
        return [];
    }
};

export type { Chat };
export type { UserProfile };
export type { DreamEntry };
