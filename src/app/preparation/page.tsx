

import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowRight, Check, HeartHandshake, Leaf, Minus, Sparkles, Sprout, Wind, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Metadata } from 'next';
import PreparationPageContent from './PreparationPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';
  
  return {
    title: 'Guía de Preparación para tu Ceremonia | El Arte de Sanar',
    description: 'Prepárate para tu ceremonia de Ayahuasca con nuestra guía completa. Aprende sobre la dieta, la preparación mental y emocional, y qué llevar para tu viaje de sanación.',
    openGraph: {
      title: 'Guía de Preparación para tu Ceremonia | El Arte de Sanar',
      description: 'Una guía completa para prepararte física, mental y emocionalmente para tu ceremonia de medicina ancestral.',
      images: [ { url: ogImage } ],
    },
  };
}

export default function PreparationPage() {
    return (
        <EditableProvider>
            <PreparationPageContent />
        </EditableProvider>
    );
}
