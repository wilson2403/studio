
import GuidesPageContent from '@/components/guides/page';
import { EditableProvider } from '@/components/home/EditableProvider';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';
  
  return {
    title: 'Nuestros Guías | El Arte de Sanar',
    description: 'Conoce a los guías espirituales de El Arte de Sanar. Maestros con profunda conexión y formación en la Amazonía, listos para acompañarte en tu viaje de sanación.',
    openGraph: {
      title: 'Nuestros Guías | El Arte de Sanar',
      description: 'Conoce a nuestros guías espirituales, formados en la Amazonía y dedicados a tu proceso de transformación y sanación.',
      images: [ { url: ogImage } ],
    },
  };
}

export default function GuidesPage() {
    return (
        <EditableProvider>
            <GuidesPageContent />
        </EditableProvider>
    )
}
