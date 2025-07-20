'use client';

import { EditableTitle } from './EditableTitle';

export default function Hero() {
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
        <div className="flex flex-col items-center space-y-6">
          <EditableTitle 
            tag="h1"
            id="heroTitle"
            initialValue="Un Encuentro Sagrado con Medicinas Ancestrales"
            className="text-4xl md:text-6xl font-headline tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
          />
          <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body">
             <EditableTitle 
                tag="p"
                id="heroSubtitle1"
                initialValue="👋 Hola, soy Wilson Alfaro, formado en la selva del Amazonas, Perú 🇵🇪🌿. Junto a un círculo de 3 guías espirituales, sostendremos un espacio de sanación profunda, cuidado y transformación ✨"
            />
             <EditableTitle 
                tag="p"
                id="heroSubtitle2"
                initialValue="¿Sientes el llamado a sanar y despertar? 🦋 Este encuentro sagrado es para quienes desean soltar cargas, sanar heridas profundas y recordar su verdadero propósito."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
