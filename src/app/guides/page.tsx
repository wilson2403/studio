
import GuidesPageContent from '@/components/guides/page';
import { EditableProvider } from '@/components/home/EditableProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuestros Guías | El Arte de Sanar',
  description: 'Conoce a los guías espirituales de El Arte de Sanar. Maestros con profunda conexión y formación en la Amazonía, listos para acompañarte en tu viaje de sanación.',
  openGraph: {
    title: 'Nuestros Guías | El Arte de Sanar',
    description: 'Conoce a nuestros guías espirituales, formados en la Amazonía y dedicados a tu proceso de transformación y sanación.',
    images: [ { url: 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg' } ],
  },
};

export default function GuidesPage() {
    return (
        <EditableProvider>
            <GuidesPageContent />
        </EditableProvider>
    )
}
