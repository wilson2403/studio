
import { EditableProvider } from '@/components/home/EditableProvider';
import type { Metadata } from 'next';
import PreparationPageContent from './PreparationPageContent';

export const metadata: Metadata = {
  title: 'Guía de Preparación para tu Ceremonia | El Arte de Sanar',
  description: 'Prepárate para tu ceremonia de Ayahuasca con nuestra guía completa. Aprende sobre la dieta, la preparación mental y emocional, y qué llevar para tu viaje de sanación.',
  openGraph: {
    title: 'Guía de Preparación para tu Ceremonia | El Arte de Sanar',
    description: 'Una guía completa para prepararte física, mental y emocionalmente para tu ceremonia de medicina ancestral.',
    images: [ { url: 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg' } ],
  },
};

export default function PreparationPage() {
    return (
        <EditableProvider>
            <PreparationPageContent />
        </EditableProvider>
    );
}
