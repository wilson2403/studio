
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc, getDoc, query, serverTimestamp, writeBatch, where, orderBy } from 'firebase/firestore';
import { db, storage } from './config';
import type { Ceremony, PastCeremony, Guide, UserProfile, ThemeSettings, Chat, ChatMessage, QuestionnaireAnswers, UserStatus } from '@/types';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const ceremoniesCollection = collection(db, 'ceremonies');
const contentCollection = collection(db, 'content');
const guidesCollection = collection(db, 'guides');
const usersCollection = collection(db, 'users');
const settingsCollection = collection(db, 'settings');
const chatsCollection = collection(db, 'chats');
const questionnairesCollection = collection(db, 'questionnaires');


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
    return null;
  }
}

export const setContent = async (id: string, value: string | { [key: string]: string }): Promise<void> => {
   try {
    const docRef = doc(db, 'content', id);
    await setDoc(docRef, { value });
  } catch (error) {
    console.error("Error setting content: ", error);
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
      featured: false,
      mediaUrl: 'https://streamable.com/e/x6y0g9',
      mediaType: 'video',
      videoFit: 'cover',
      contributionText: 'Puedes reservar con el 20%',
      status: 'active',
      date: '2024-07-26',
      horario: '4:00 p.m. (sábado) – 7:00 a.m. (domingo)⏰'
    },
    {
      title: 'Sábado 2 de agosto – San Carlos',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 80000,
      priceType: 'from',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
      link: 'https://wa.me/50687992560?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%202%20de%20agosto%20en%20San%20Carlos',
      featured: true,
      mediaUrl: 'https://www.tiktok.com/@elartedesanarcr/video/7391992796355153157',
      mediaType: 'video',
      videoFit: 'cover',
      plans: [
        { name: 'Plan Básico', price: 80000, description: "Incluye ceremonia y guía." },
        { name: 'Plan Completo', price: 100000, priceUntil: 120000, description: "Incluye ceremonia, guía y hospedaje." }
      ],
      contributionText: 'Puedes reservar con el 20%',
      status: 'active',
      date: '2024-08-02',
      horario: '4:00 p.m. (sábado) – 7:00 a.m. (domingo)⏰'
    },
    {
      title: 'Transformación Interior',
      description: '“Una experiencia que cambió mi perspectiva por completo.”',
      date: 'Junio 2024',
      mediaType: 'video',
      videoFit: 'cover',
      mediaUrl: 'https://videos.pexels.com/video-files/8086041/8086041-hd_1920_1080_25fps.mp4',
      status: 'finished',
      price: 0,
      priceType: 'exact',
      features: [],
      link: '#',
      featured: false,
    },
     {
      title: 'Ceremonia Inactiva de Prueba',
      description: 'Este es un ejemplo de una ceremonia inactiva.',
      date: 'Enero 2024',
      mediaType: 'image',
      videoFit: 'cover',
      mediaUrl: 'https://placehold.co/600x400.png',
      status: 'inactive',
      price: 0,
      priceType: 'exact',
      features: [],
      link: '#',
      featured: false,
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
    let q;
    if (status) {
      q = query(ceremoniesCollection, where('status', '==', status));
    } else {
      q = collection(db, 'ceremonies');
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty && !status) {
        console.log('No ceremonies found, seeding database...');
        await seedCeremonies();
        const newSnapshot = await getDocs(q);
        return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ceremony));
    }

    const ceremoniesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ceremony));
    
    // Manual sorting in code
    ceremoniesData.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      
      if (status === 'active') {
        // Sort featured first, then by date
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return dateA.localeCompare(dateB);
      }
      
      if (status === 'inactive') {
        return dateA.localeCompare(dateB);
      }
      
      if (status === 'finished') {
        return dateB.localeCompare(dateA);
      }

      // Default sorting for all ceremonies
      const statusOrder = { active: 1, inactive: 2, finished: 3 };
      const statusComparison = (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      if (statusComparison !== 0) return statusComparison;
      
      if (a.status === 'active') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
      }
      
      if (a.status === 'finished') return dateB.localeCompare(dateA); 
      return dateA.localeCompare(dateB);
    });

    return ceremoniesData;
  } catch (error) {
    console.error("Error fetching ceremonies: ", error);
    return [];
  }
};


export const addCeremony = async (ceremony: Omit<Ceremony, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(ceremoniesCollection, ceremony);
        return docRef.id;
    } catch(error) {
        console.error("Error adding ceremony: ", error);
        throw error;
    }
}

export const updateCeremony = async (ceremony: Ceremony): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', ceremony.id);
        const { id, ...data } = ceremony;
        await updateDoc(ceremonyRef, data);
    } catch(error) {
        console.error("Error updating ceremony: ", error);
        throw error;
    }
}

export const deleteCeremony = async (id: string): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', id);
        await deleteDoc(ceremonyRef);
    } catch(error) {
        console.error("Error deleting ceremony: ", error);
        throw error;
    }
}

export const finishCeremony = async (ceremony: Ceremony): Promise<void> => {
  try {
    const ceremonyRef = doc(db, 'ceremonies', ceremony.id);
    await updateDoc(ceremonyRef, { status: 'finished' });
  } catch (error) {
    console.error("Error finishing ceremony: ", error);
    throw error;
  }
};

export const inactivateCeremony = async (ceremony: Ceremony): Promise<void> => {
  try {
    const ceremonyRef = doc(db, 'ceremonies', ceremony.id);
    await updateDoc(ceremonyRef, { status: 'inactive' });
  } catch (error) {
    console.error("Error inactivating ceremony: ", error);
    throw error;
  }
};


export const reactivateCeremony = async (ceremony: Ceremony): Promise<void> => {
  try {
    const ceremonyRef = doc(db, 'ceremonies', ceremony.id);
    await updateDoc(ceremonyRef, { status: 'active' });
  } catch (error) {
    console.error("Error reactivating ceremony: ", error);
    throw error;
  }
};


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
        return [];
    }
}


export const updateGuide = async (guide: Guide): Promise<void> => {
    try {
        const guideRef = doc(db, 'guides', guide.id);
        const { id, ...data } = guide; 
        await updateDoc(guideRef, data);

    } catch (error) {
        console.error("Error updating guide: ", error);
        throw error;
    }
}

export const deleteGuide = async (id: string): Promise<void> => {
    try {
        const guideRef = doc(db, 'guides', id);
        await deleteDoc(guideRef);
    } catch (error) {
        console.error("Error deleting guide: ", error);
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
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            resolve(downloadURL);
          })
          .catch((error) => {
            console.error("Failed to get download URL:", error);
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
        return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
        console.error("Error getting all users:", error);
        return [];
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
        return null;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export const updateUserRole = async (uid: string, isAdmin: boolean): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { isAdmin });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};

export const updateUserStatus = async (uid: string, status: UserStatus): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { status });
    } catch (error) {
        console.error("Error updating user status:", error);
        throw error;
    }
};


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
        return null;
    }
}

export const setThemeSettings = async (settings: ThemeSettings): Promise<void> => {
    try {
        const docRef = doc(db, 'settings', 'theme');
        await setDoc(docRef, settings);
    } catch (error) {
        console.error("Error setting theme settings:", error);
        throw error;
    }
}


// --- Chat ---

export const saveChatMessage = async (chatId: string, messages: ChatMessage[], user: { uid: string, email: string | null, displayName: string | null } | null) => {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

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
        return null;
    }
};


export const getAllChats = async (): Promise<Chat[]> => {
    try {
        const snapshot = await getDocs(chatsCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
    } catch (error) {
        console.error("Error fetching chats: ", error);
        return [];
    }
};


// --- Questionnaire ---

export const saveQuestionnaire = async (uid: string, answers: QuestionnaireAnswers): Promise<void> => {
    const batch = writeBatch(db);
    
    const questionnaireRef = doc(db, 'questionnaires', uid);
    batch.set(questionnaireRef, {
        ...answers,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    const userRef = doc(db, 'users', uid);
    batch.update(userRef, { questionnaireCompleted: true });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error saving questionnaire and updating user profile:", error);
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
        return null;
    }
};

export type { Chat };
export type { UserProfile };

    

    

    




    
