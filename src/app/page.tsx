'use client';

import Hero from '@/components/home/Hero';
import Ceremonies from '@/components/home/Ceremonies';
import PastCeremonies from '@/components/home/PastCeremonies';
import { EditableProvider } from '@/components/home/EditableProvider';
import AyahuascaInfo from '@/components/home/AyahuascaInfo';
import PreparationCta from '@/components/home/PreparationCta';
import Contact from '@/components/home/Contact';

export default function Home() {
  return (
    <EditableProvider>
      <Hero />
      <AyahuascaInfo />
      <Ceremonies />
      <PreparationCta />
      <PastCeremonies />
      <Contact />
    </EditableProvider>
  );
}
