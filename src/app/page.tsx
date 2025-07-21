
'use client';

import Ceremonies from '@/components/home/Ceremonies';
import { EditableProvider } from '@/components/home/EditableProvider';
import PreparationCta from '@/components/home/PreparationCta';
import Contact from '@/components/home/Contact';
import RegistrationPromptDialog from '@/components/auth/RegistrationPromptDialog';
import { useTranslation } from 'react-i18next';
import PastCeremoniesSection from '@/components/home/PastCeremoniesSection';
import Hero from '@/components/home/Hero';

export default function Home() {
  const { t } = useTranslation();
  return (
    <EditableProvider>
      <RegistrationPromptDialog />
      <Hero />
      <Ceremonies />
      <PastCeremoniesSection />
      <PreparationCta />
      <Contact />
    </EditableProvider>
  );
}
