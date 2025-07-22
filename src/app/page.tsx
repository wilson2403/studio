
'use client';

import Ceremonies from '@/components/home/Ceremonies';
import Contact from '@/components/home/Contact';
import RegistrationPromptDialog from '@/components/auth/RegistrationPromptDialog';
import { useTranslation } from 'react-i18next';
import Hero from '@/components/home/Hero';
import ExploreMore from '@/components/home/ExploreMore';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="container">
      <RegistrationPromptDialog />
      <Hero />
      <Ceremonies
        status="active"
        id="ceremonias"
        titleId="upcomingCeremoniesTitle"
        titleInitialValue={t('upcomingCeremoniesTitle')}
      />
      <Ceremonies
        status="finished"
        id="eventos-anteriores"
        titleId="pastEventsTitle"
        titleInitialValue={t('pastEventsTitle')}
      />
      <ExploreMore />
      <Contact />
    </div>
  );
}
