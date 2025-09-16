
import AllCeremoniesPage from '@/app/ceremonias/page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ceremonias de Ayahuasca | El Arte de Sanar',
  description: 'Explora nuestras próximas ceremonias de Ayahuasca en Costa Rica. Únete a un viaje de sanación, transformación y conexión espiritual guiado por maestros expertos.',
  openGraph: {
    title: 'Ceremonias de Ayahuasca | El Arte de Sanar',
    description: 'Encuentra tu ceremonia y reserva tu espacio. Vive una experiencia transformadora con la medicina ancestral en un entorno seguro y de confianza.',
    images: [ { url: 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg' } ],
  },
};

export default function CeremoniesPage() {
    return <AllCeremoniesPage />;
}
