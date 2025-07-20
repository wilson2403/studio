'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Edit, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCeremonies, Ceremony, seedCeremonies } from '@/lib/firebase/firestore';
import EditCeremonyDialog from './EditCeremonyDialog';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function Ceremonies() {
  const [user, setUser] = useState<User | null>(null);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCeremonies = async () => {
      setLoading(true);
      let ceremoniesData = await getCeremonies();
      if (ceremoniesData.length === 0) {
        console.log('No ceremonies found, seeding database...');
        await seedCeremonies();
        ceremoniesData = await getCeremonies();
      }
      setCeremonies(ceremoniesData);
      setLoading(false);
    };
    fetchCeremonies();
  }, []);

  const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
    setCeremonies(ceremonies.map(c => c.id === updatedCeremony.id ? updatedCeremony : c));
    setEditingCeremony(null);
  };
  
  const handleCeremonyAdd = (newCeremony: Ceremony) => {
    setCeremonies([...ceremonies, newCeremony]);
    setIsAdding(false);
  }

  const handleCeremonyDelete = (id: string) => {
    setCeremonies(ceremonies.filter(c => c.id !== id));
    setEditingCeremony(null);
  }
  
  const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
     setCeremonies([...ceremonies, newCeremony]);
  }

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <section id="ceremonias" className="container py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
             <Card key={i} className="flex flex-col rounded-2xl border-2 border-card-foreground/10 h-[550px] animate-pulse bg-card/50"></Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="ceremonias"
      className="container py-12 md:py-24 animate-in fade-in-0 duration-1000 delay-500"
    >
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h2 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          Próximas Ceremonias
        </h2>
        <p className="max-w-2xl text-lg text-foreground/80 font-body">
          Estos son nuestros próximos encuentros. Cada uno es una oportunidad
          única para sanar y reconectar.
        </p>
         {isAdmin && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusCircle className="mr-2" />
            Añadir Ceremonia
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ceremonies.map((ceremony) => (
          <Card
            key={ceremony.id}
            className={`relative flex flex-col rounded-2xl border-2 hover:border-primary/80 transition-all duration-300 group overflow-hidden ${
              ceremony.featured
                ? 'border-primary shadow-[0_0_30px_-10px] shadow-primary/50'
                : 'border-card-foreground/10'
            }`}
          >
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full z-10 bg-black/50 hover:bg-black/80"
                onClick={() => setEditingCeremony(ceremony)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
             <CardHeader className="p-0">
               <div className="aspect-video overflow-hidden">
                {ceremony.mediaType === 'video' ? (
                   <video src={ceremony.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Image src={ceremony.mediaUrl || 'https://placehold.co/600x400.png'} alt={ceremony.title} width={600} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint="spiritual ceremony" />
                )}
               </div>
            </CardHeader>
            <div className="p-6 flex flex-col flex-1">
              <CardTitle className="text-2xl font-headline tracking-wide">
                {ceremony.title}
              </CardTitle>
              <CardDescription className="font-body text-base mt-2">
                {ceremony.description}
              </CardDescription>
            <CardContent className="flex-1 space-y-6 mt-6 p-0">
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground">
                  {ceremony.price}
                </span>
                <p className="text-sm text-muted-foreground">
                  hasta 100.000 plan completo
                </p>
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
            <CardFooter className="p-0 pt-6">
              <Button
                asChild
                className={`w-full text-lg font-bold rounded-xl h-12 ${
                  ceremony.featured
                    ? 'bg-gradient-to-r from-primary via-fuchsia-500 to-purple-500 text-primary-foreground hover:opacity-90'
                    : ''
                }`}
                variant={ceremony.featured ? 'default' : 'outline'}
              >
                <Link
                  href={ceremony.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reservar Cupo
                </Link>
              </Button>
            </CardFooter>
            </div>
          </Card>
        ))}
      </div>
      {(editingCeremony || isAdding) && (
        <EditCeremonyDialog
          ceremony={editingCeremony}
          isOpen={!!editingCeremony || isAdding}
          onClose={() => {
            setEditingCeremony(null);
            setIsAdding(false);
          }}
          onUpdate={handleCeremonyUpdate}
          onAdd={handleCeremonyAdd}
          onDelete={handleCeremonyDelete}
          onDuplicate={handleCeremonyDuplicate}
        />
      )}
    </section>
  );
}
