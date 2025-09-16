
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';
  
  return {
    title: 'Inicia tu Viaje de Sanación | El Arte de Sanar',
    description: 'Completa nuestro cuestionario de preparación para comenzar tu viaje de sanación con medicina ancestral. Este es el primer paso hacia tu transformación.',
    openGraph: {
      title: 'Inicia tu Viaje de Sanación | El Arte de Sanar',
      description: 'Completa el cuestionario y sigue nuestra guía de preparación para vivir una experiencia transformadora con la medicina Ayahuasca.',
      images: [ { url: ogImage } ],
    },
  };
}

export default function ArtesanarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

    