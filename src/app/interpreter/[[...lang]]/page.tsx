import type { Metadata } from 'next';
import InterpreterClientPage from './client';

export const metadata: Metadata = {
  title: 'Intérprete de Sueños | El Arte de Sanar',
  description: 'Explora el significado de tus sueños y experiencias con una guía espiritual basada en la sabiduría ancestral y junguiana.',
  openGraph: {
    title: "Intérprete de Sueños | El Arte de Sanar",
    description: "Descubre los mensajes que tu subconsciente tiene para ti. ¡Es completamente privado y personal!",
    url: "https://artedesanar.vercel.app/interpreter",
    siteName: "El Arte de Sanar",
    images: [
      {
        url: 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg',
        width: 800,
        height: 600,
        alt: 'Intérprete de Sueños de El Arte de Sanar',
      },
    ],
    type: "website",
    locale: "es_CR",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intérprete de Sueños | El Arte de Sanar',
    description: 'Explora el significado de tus sueños y experiencias.',
    images: ['https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg'],
  },
};

export default function InterpreterPage({ params }: { params: { lang?: string[] } }) {
  // The 'lang' param will be an array. If the URL is /interpreter, it will be undefined.
  // If /interpreter/es, it will be ['es']. We take the first element or default to 'es'.
  const lang = params.lang?.[0];
  return <InterpreterClientPage lang={lang} />;
}

  

    