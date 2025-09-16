
import HomePageContent from '@/components/home/HomePageContent';
import type { Metadata } from 'next';

const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg?v=1.1';

export const metadata: Metadata = {
  title: 'El Arte de Sanar 🌿 | Ceremonias de Medicina Ancestral en Costa Rica',
  description: 'Sanación interior, conexión espiritual y transformación con medicina ancestral en Costa Rica.',
  openGraph: {
    title: "El Arte de Sanar 🌿 | Medicina Ancestral en Costa Rica",
    description: "Sanación interior, conexión espiritual y transformación con medicina ancestral en Costa Rica.",
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
    title: 'El Arte de Sanar 🌿',
    description: 'Un viaje profundo del alma en Costa Rica.',
    images: [ogImage],
  },
};

export default function Home() {
  return <HomePageContent />;
}
