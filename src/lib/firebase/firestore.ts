
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from './config';
import type { Ceremony, PastCeremony } from '@/types';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const ceremoniesCollection = collection(db, 'ceremonies');
const pastCeremoniesCollection = collection(db, 'pastCeremonies');


// --- Ceremonies ---

export const seedCeremonies = async () => {
  const initialCeremonies: Omit<Ceremony, 'id'>[] = [
    {
      title: 'Sábado 26 de julio – Guanacaste',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Plan completo hasta 100.000'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2026%20de%20julio%20en%20Guanacaste',
      featured: true,
      mediaUrl: 'https://placehold.co/600x400.png',
      mediaType: 'image',
    },
    {
      title: 'Sábado 2 de agosto – San Carlos',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Plan completo hasta 100.000'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%202%20de%20agosto%20en%20San%20Carlos',
      featured: false,
      mediaUrl: 'https://placehold.co/600x400.png',
      mediaType: 'image',
    },
    {
      title: 'Sábado 9 de agosto – Pérez Zeledón',
      description: 'Horario: 5:00 p.m. a 8:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%209%20de%20agosto%20en%20Pérez%20Zeledón',
      featured: false,
      mediaUrl: 'https://placehold.co/600x400.png',
      mediaType: 'image',
    },
    {
      title: 'Sábado 23 de agosto – La Fortuna',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Círculo de sonido'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2023%20de%20agosto%20en%20La%20Fortuna',
      featured: false,
       mediaUrl: 'https://placehold.co/600x400.png',
      mediaType: 'image',
    },
  ];

  for (const ceremony of initialCeremonies) {
    await addDoc(collection(db, 'ceremonies'), ceremony);
  }
  console.log('Seeded ceremonies data.');
};


export const getCeremonies = async (): Promise<Ceremony[]> => {
  try {
    const snapshot = await getDocs(ceremoniesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ceremony));
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


// --- Past Ceremonies (Videos) ---

export const seedPastCeremonies = async () => {
    const initialData: Omit<PastCeremony, 'id'>[] = [
        {
            videoUrl: 'https://videos.pexels.com/video-files/8086041/8086041-hd_1920_1080_25fps.mp4',
            title: 'Transformación Interior',
            description: '“Una experiencia que cambió mi perspectiva por completo.”',
        },
        {
            videoUrl: 'https://videos.pexels.com/video-files/4494493/4494493-hd_1920_1080_25fps.mp4',
            title: 'Conexión Profunda',
            description: '“Nunca me había sentido tan conectado con la naturaleza y conmigo mismo.”',
        },
        {
            videoUrl: 'https://videos.pexels.com/video-files/3840441/3840441-hd_1920_1080_30fps.mp4',
            title: 'Sanación y Paz',
            description: '“Encontré la paz que tanto buscaba. Un viaje de sanación inolvidable.”',
        },
    ];

    for (const item of initialData) {
        await addDoc(pastCeremoniesCollection, item);
    }
    console.log('Seeded past ceremonies data.');
};


export const getPastCeremonies = async (): Promise<PastCeremony[]> => {
    try {
        const snapshot = await getDocs(pastCeremoniesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PastCeremony));
    } catch (error) {
        console.error("Error fetching past ceremonies: ", error);
        return [];
    }
}

export const addPastCeremony = async (data: Omit<PastCeremony, 'id'>): Promise<string> => {
    const docRef = await addDoc(pastCeremoniesCollection, data);
    return docRef.id;
}

export const updatePastCeremony = async (data: PastCeremony): Promise<void> => {
    const docRef = doc(db, 'pastCeremonies', data.id);
    const { id, ...firestoreData } = data;
    await updateDoc(docRef, firestoreData);
}

export const deletePastCeremony = async (id: string): Promise<void> => {
    const docRef = doc(db, 'pastCeremonies', id);
    await deleteDoc(docRef);
}


// --- Firebase Storage ---

export const uploadVideo = (file: File, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `past-ceremonies/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

    