
'use client';

import Ceremonies from '@/components/home/Ceremonies';
import { EditableProvider } from '@/components/home/EditableProvider';
import PreparationCta from '@/components/home/PreparationCta';
import Contact from '@/components/home/Contact';
import RegistrationPromptDialog from '@/components/auth/RegistrationPromptDialog';
import PastCeremonies from '@/components/home/PastCeremonies';
import { useTranslation } from 'react-i18next';
import { EditableTitle } from '@/components/home/EditableTitle';
import PastCeremoniesSection from '@/components/home/PastCeremoniesSection';

export default function Home() {
  const { t } = useTranslation();
  return (
    <EditableProvider>
      <RegistrationPromptDialog />
      <section className="relative w-full py-12 md:py-20 flex flex-col items-center justify-center text-center gap-12 group">
        <div className="container relative animate-in fade-in-0 duration-1000 z-20">
          <div className="flex flex-col items-center space-y-2">
            <EditableTitle
              tag="h1"
              id="heroTitle"
              initialValue={t('heroTitle')}
              className="text-4xl md:text-6xl font-headline tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
            />
            <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body">
              <EditableTitle
                tag="p"
                id="heroSubtitle1"
                initialValue={t('heroSubtitle1')}
              />
            </div>
          </div>
        </div>
        <div className="w-full px-4 md:px-0">
            <PastCeremonies />
        </div>
        <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body animate-in fade-in-0 duration-1000 delay-700">
          <EditableTitle
            tag="p"
            id="heroSubtitle2"
            initialValue={t('heroSubtitle2')}
          />
        </div>
      </section>
      <Ceremonies />
      <PastCeremoniesSection />
      <PreparationCta />
      <Contact />
    </EditableProvider>
  );
}
