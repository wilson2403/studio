'use client';

import Hero from '@/components/home/Hero';
import Ceremonies from '@/components/home/Ceremonies';
import { EditableProvider } from '@/components/home/EditableProvider';
import PreparationCta from '@/components/home/PreparationCta';
import Contact from '@/components/home/Contact';
import RegistrationPromptDialog from '@/components/auth/RegistrationPromptDialog';

export default function Home() {
  return (
    <EditableProvider>
      <RegistrationPromptDialog />
      <Hero />
      <Ceremonies />
      <PreparationCta />
      <Contact />
    </EditableProvider>
  );
}
