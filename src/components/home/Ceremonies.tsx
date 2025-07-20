'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';

const mockCeremonies = [
  {
    id: '1',
    titulo: 'Ceremonia de Ayahuasca',
    modalidad: 'Presencial',
    imagen: 'https://placehold.co/600x400.png',
    dataAiHint: 'shamanic ritual',
    link_mas_info: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20la%20Ceremonia%20de%20Ayahuasca',
  },
  {
    id: '2',
    titulo: 'Retiro de Silencio y Meditación',
    modalidad: 'Presencial',
    imagen: 'https://placehold.co/600x400.png',
    dataAiHint: 'meditation retreat',
    link_mas_info: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20el%20Retiro%20de%20Silencio',
  },
  {
    id: '3',
    titulo: 'Círculo de Sonido Sanador',
    modalidad: 'Online',
    imagen: 'https://placehold.co/600x400.png',
    dataAiHint: 'sound healing',
    link_mas_info: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20el%20Círculo%20de%20Sonido',
  },
  {
    id: '4',
    titulo: 'Taller de Respiración Holotrópica',
    modalidad: 'Presencial',
    imagen: 'https://placehold.co/600x400.png',
    dataAiHint: 'breathing workshop',
    link_mas_info: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20el%20Taller%20de%20Respiración',
  },
    {
    id: '5',
    titulo: 'Temazcal de Luna Nueva',
    modalidad: 'Presencial',
    imagen: 'https://placehold.co/600x400.png',
    dataAiHint: 'temazcal ceremony',
    link_mas_info: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20el%20Temazcal',
  },
];

export default function Ceremonies() {
  return (
    <section id="ceremonias" className="container py-12 md:py-24 animate-in fade-in-0 duration-1000 delay-500">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h2 className="text-4xl md:text-5xl font-headline text-primary">Próximas Ceremonias</h2>
        <p className="max-w-2xl text-lg text-foreground/80 font-body">
          Estos son nuestros próximos encuentros. Cada uno es una oportunidad única para sanar y reconectar.
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
          {mockCeremonies.map((ceremony) => (
            <CarouselItem key={ceremony.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                   <CardContent className="p-0">
                    <div className="aspect-video relative">
                       <Image
                        src={ceremony.imagen}
                        alt={ceremony.titulo}
                        fill
                        className="object-cover"
                        data-ai-hint={ceremony.dataAiHint}
                      />
                    </div>
                  </CardContent>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl tracking-tight">{ceremony.titulo}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{ceremony.modalidad}</Badge>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href={ceremony.link_mas_info} target="_blank" rel="noopener noreferrer">
                        <WhatsappIcon className="mr-2" />
                        Reservar por WhatsApp
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </section>
  );
}
