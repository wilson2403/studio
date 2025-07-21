
'use client';

import Ceremonies from '@/components/home/Ceremonies';
import { EditableProvider } from '@/components/home/EditableProvider';
import PreparationCta from '@/components/home/PreparationCta';
import Contact from '@/components/home/Contact';
import RegistrationPromptDialog from '@/components/auth/RegistrationPromptDialog';
import { useTranslation } from 'react-i18next';
import Hero from '@/components/home/Hero';
import WelcomeTour from '@/components/auth/WelcomeTour';
import ExploreMore from '@/components/home/ExploreMore';
import { useState } from 'react';

export default function Home() {
  const { t } = useTranslation();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <EditableProvider>
      <WelcomeTour />
      <RegistrationPromptDialog />
      <Hero />
      <Ceremonies 
        status="finished" 
        id="eventos-anteriores"
        titleId="pastEventsTitle"
        titleInitialValue={t('pastEventsTitle')}
        activeVideo={activeVideo}
        setActiveVideo={setActiveVideo}
      />
      <Ceremonies 
        status="active" 
        id="ceremonias"
        activeVideo={activeVideo}
        setActiveVideo={setActiveVideo}
      />
      <PreparationCta />
      <ExploreMore />
      <Contact />
    </EditableProvider>
  );
}
