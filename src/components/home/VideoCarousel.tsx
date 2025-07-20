'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const videos = [
  {
    src: 'https://videos.pexels.com/video-files/8086041/8086041-hd_1920_1080_25fps.mp4',
    title: 'Transformación Interior',
    description: '“Una experiencia que cambió mi perspectiva por completo.”',
  },
  {
    src: 'https://videos.pexels.com/video-files/4494493/4494493-hd_1920_1080_25fps.mp4',
    title: 'Conexión Profunda',
    description: '“Nunca me había sentido tan conectado con la naturaleza y conmigo mismo.”',
  },
  {
    src: 'https://videos.pexels.com/video-files/3840441/3840441-hd_1920_1080_30fps.mp4',
    title: 'Sanación y Paz',
    description: '“Encontré la paz que tanto buscaba. Un viaje de sanación inolvidable.”',
  },
];

export default function VideoCarousel() {
  return (
    <section className="container py-12 md:py-24">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h2 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          Testimonios de Transformación
        </h2>
        <p className="max-w-2xl text-lg text-foreground/80 font-body">
          Escucha las historias de quienes ya han iniciado su viaje de sanación con nosotros.
        </p>
      </div>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {videos.map((video, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <div className="relative rounded-2xl overflow-hidden aspect-video group">
                  <video
                    src={video.src}
                    playsInline
                    loop
                    muted
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onMouseOver={event => (event.target as HTMLVideoElement).play()}
                    onMouseOut={event => (event.target as HTMLVideoElement).pause()}
                  />
                   <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300"></div>
                   <div className="absolute bottom-0 left-0 p-6 text-white">
                      <h3 className="text-xl font-headline">{video.title}</h3>
                      <p className="font-body text-sm opacity-90">{video.description}</p>
                   </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex"/>
      </Carousel>
    </section>
  );
}
