

import { EditableProvider } from '@/components/home/EditableProvider';
import type { Metadata } from 'next';
import TestimonialsPageContent from './TestimonialsPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';
  
  return {
    title: 'Testimonios de Sanación | El Arte de Sanar',
    description: 'Lee y escucha las experiencias transformadoras de quienes han participado en nuestras ceremonias de Ayahuasca. Descubre historias reales de sanación, claridad y conexión.',
    openGraph: {
      title: 'Testimonios de Sanación | El Arte de Sanar',
      description: 'Inspírate con las historias de transformación de nuestra comunidad. Experiencias auténticas de quienes han recorrido el camino de la medicina ancestral.',
      images: [ { url: ogImage } ],
    },
  };
}

export default function TestimonialsPage() {
    return (
        <EditableProvider>
            <TestimonialsPageContent />
        </EditableProvider>
    );
}
