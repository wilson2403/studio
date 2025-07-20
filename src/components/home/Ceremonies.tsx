'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const ceremonies = [
  {
    title: 'Sábado 26 de julio – Guanacaste',
    description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
    price: 'Desde ₡50.000',
    features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
    link: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2026%20de%20julio%20en%20Guanacaste',
    featured: true,
  },
  {
    title: 'Sábado 9 de agosto – Pérez Zeledón',
    description: 'Horario: 5:00 p.m. a 8:00 a.m. del día siguiente',
    price: 'Desde ₡50.000',
    features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa'],
    link: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%209%20de%20agosto%20en%20Pérez%20Zeledón',
    featured: false,
  },
  {
    title: 'Sábado 23 de agosto – La Fortuna',
    description: 'Horario: 4:00 p.m. a 7:00 a.m. del día siguiente',
    price: 'Desde ₡50.000',
    features: ['Alimentación', 'Estadía', 'Guía espiritual', 'Preparación previa', 'Círculo de sonido'],
    link: 'https://wa.me/1234567890?text=Hola,%20quisiera%20más%20información%20sobre%20la%20ceremonia%20del%2023%20de%20agosto%20en%20La%20Fortuna',
    featured: false,
  },
];

export default function Ceremonies() {
  return (
    <section id="ceremonias" className="container py-12 md:py-24 animate-in fade-in-0 duration-1000 delay-500">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h2 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          Próximas Ceremonias
        </h2>
        <p className="max-w-2xl text-lg text-foreground/80 font-body">
          Estos son nuestros próximos encuentros. Cada uno es una oportunidad única para sanar y reconectar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ceremonies.map((ceremony, index) => (
          <Card
            key={index}
            className={`flex flex-col rounded-2xl border-2 hover:border-primary/80 transition-all duration-300 ${
              ceremony.featured ? 'border-primary shadow-[0_0_30px_-10px] shadow-primary/50' : 'border-card-foreground/10'
            }`}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline tracking-wide">{ceremony.title}</CardTitle>
              <CardDescription className="font-body text-base">
                {ceremony.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
               <div className="text-center">
                <span className="text-4xl font-bold text-foreground">{ceremony.price}</span>
                <p className="text-sm text-muted-foreground">hasta 100.000 plan completo</p>
              </div>
              <ul className="space-y-4">
                 <li className="flex items-center gap-3 font-bold">
                    <Check className="h-5 w-5 text-primary" />
                    <span>🍲 Incluye:</span>
                  </li>
                {ceremony.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 ml-4">
                    <Check className="h-5 w-5 text-primary/70" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className={`w-full text-lg font-bold rounded-xl h-12 ${
                  ceremony.featured
                    ? 'bg-gradient-to-r from-primary via-fuchsia-500 to-purple-500 text-primary-foreground hover:opacity-90'
                    : ''
                }`}
                variant={ceremony.featured ? 'default' : 'outline'}
              >
                <Link href={ceremony.link} target="_blank" rel="noopener noreferrer">
                  Reservar Cupo
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
