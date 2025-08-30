
import HomePageContent from '@/components/home/HomePageContent';
import type { Metadata } from 'next';

const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';

export const metadata: Metadata = {
  title: 'Ceremonias de Ayahuasca en Costa Rica - El Arte de Sanar',
  description: 'Ofrecemos ceremonias de ayahuasca con enfoque terapéutico, espiritual y ancestral en Costa Rica. Transformación interior y conexión con la medicina.',
  openGraph: {
    title: "Ceremonias de Ayahuasca en Costa Rica - El Arte de Sanar",
    description: "Ofrecemos ceremonias de ayahuasca con enfoque terapéutico, espiritual y ancestral en Costa Rica. Transformación interior y conexión con la medicina.",
    url: "https://artedesanar.vercel.app",
    siteName: "El Arte de Sanar",
    images: [
      {
        url: ogImage,
        width: 800,
        height: 600,
        alt: 'El Arte de Sanar',
      },
    ],
    type: "website",
    locale: "es_CR",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ceremonias de Ayahuasca en Costa Rica - El Arte de Sanar',
    description: 'Ofrecemos ceremonias de ayahuasca con enfoque terapéutico, espiritual y ancestral en Costa Rica. Transformación interior y conexión con la medicina.',
    images: [ogImage],
  },
};


export default function Home() {
  return <HomePageContent />;
}
