
import AyahuascaInfo from '@/components/home/AyahuascaInfo';
import { EditableProvider } from '@/components/home/EditableProvider';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';
  
  return {
    title: 'Qué es la Ayahuasca | El Arte de Sanar',
    description: 'Descubre qué es la Ayahuasca, cómo funciona esta medicina ancestral y los profundos beneficios que puede traer a tu vida. Una guía completa sobre la sanación y conexión espiritual.',
    openGraph: {
      title: 'Qué es la Ayahuasca | El Arte de Sanar',
      description: 'Aprende sobre la medicina ancestral, sus beneficios para la sanación emocional, mental y espiritual, y cómo te prepara para una transformación profunda.',
      images: [ { url: ogImage } ],
    },
  };
}

export default function AyahuascaPage() {
  return (
    <EditableProvider>
      <AyahuascaInfo />
    </EditableProvider>
  );
}
