
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import type { Ceremony } from '@/types';

const ceremoniesCollection = collection(db, 'ceremonies');

// NOTE: This is a one-time function to seed the database with initial data.
// You can call this from a component's useEffect hook or a dedicated admin page.
// Example:
// useEffect(() => {
//   seedCeremonies();
// }, []);
export const seedCeremonies = async () => {
  const initialCeremonies: Omit<Ceremony, 'id'>[] = [
    {
      title: 'Sábado 26 de julio – Guanacaste',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Plan completo hasta 100.000'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2026%20de%20julio%20en%20Guanacaste',
      featured: true,
    },
    {
      title: 'Sábado 2 de agosto – San Carlos',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Plan completo hasta 100.000'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%202%20de%20agosto%20en%20San%20Carlos',
      featured: false,
    },
    {
      title: 'Sábado 9 de agosto – Pérez Zeledón',
      description: 'Horario: 5:00 p.m. a 8:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%209%20de%20agosto%20en%20Pérez%20Zeledón',
      featured: false,
    },
    {
      title: 'Sábado 23 de agosto – La Fortuna',
      description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
      price: 'Desde ₡50.000',
      features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Círculo de sonido'],
      link: 'https://wa.me/50670519145?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2023%20de%20agosto%20en%20La%20Fortuna',
      featured: false,
    },
  ];

  for (const ceremony of initialCeremonies) {
    const ceremonyId = ceremony.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const docRef = doc(db, 'ceremonies', ceremonyId);
    await setDoc(docRef, ceremony);
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


export const updateCeremony = async (ceremony: Ceremony): Promise<void> => {
    try {
        const ceremonyRef = doc(db, 'ceremonies', ceremony.id);
        await updateDoc(ceremonyRef, { ...ceremony });
    } catch(error) {
        console.error("Error updating ceremony: ", error);
        throw error;
    }
}
