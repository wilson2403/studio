
'use client';

import { EditableTitle } from './EditableTitle';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative w-full pt-8 md:pt-16 flex flex-col items-center justify-center text-center group">
      
      <div className="container relative animate-in fade-in-0 duration-1000 z-20 space-y-8">
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
      
      <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body animate-in fade-in-0 duration-1000 delay-700 mt-6 mb-8">
        <EditableTitle 
            tag="p"
            id="heroSubtitle2"
            initialValue={t('heroSubtitle2')}
        />
      </div>

    </section>
  );
}
