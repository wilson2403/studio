'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Metadata } from 'next';

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


// This page is a client component that will handle the redirect and dialog logic.
export default function InterpreterPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, it doesn't need to do anything besides rendering,
    // as the logic to open the dialog is now in the dialog component itself.
    // We could potentially add a redirect here if the user navigates away from the dialog.
  }, [router]);

  return null; // This page doesn't render any visible content.
}
