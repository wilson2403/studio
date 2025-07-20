'use client';

import { EditableTitle } from './EditableTitle';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="https://videos.pexels.com/video-files/3130181/3130181-hd_1920_1080_25fps.mp4"
      ></video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-grid-white/[0.07] bg-center [mask-image:linear-gradient(to_bottom,white,transparent_70%)] z-10"></div>
      
      <div className="container relative text-center animate-in fade-in-0 duration-1000 z-20">
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
             <EditableTitle 
                tag="p"
                id="heroSubtitle2"
                initialValue={t('heroSubtitle2')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
