
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Edit, ExternalLink, PlusCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCeremonies, Ceremony, seedCeremonies } from '@/lib/firebase/firestore';
import EditCeremonyDialog from './EditCeremonyDialog';
import { EditableTitle } from './EditableTitle';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import CeremonyDetailsDialog from './CeremonyDetailsDialog';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function Ceremonies() {
  const [user, setUser] = useState<User | null>(null);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
  const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCeremonies = async () => {
      setLoading(true);
      try {
        let ceremoniesData = await getCeremonies();
        if (ceremoniesData.length === 0) {
          console.log('No ceremonies found, seeding database...');
          await seedCeremonies();
          ceremoniesData = await getCeremonies();
        }
        setCeremonies(ceremoniesData);
      } catch (error) {
        console.error("Failed to fetch or seed ceremonies:", error);
      } finally {
        setLoading(false);
      }
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

  const handleViewPlans = (ceremony: Ceremony) => {
    if (user) {
      setViewingCeremony(ceremony);
    } else {
      router.push('/login');
    }
  };

  const isAdmin = user && user.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <section id="ceremonias" className="container py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
             <Card key={i} className="flex flex-col rounded-2xl border-2 border-card-foreground/10 h-[550px] animate-pulse bg-card/50"></Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
    <section
      id="ceremonias"
      className="container py-8 md:py-16 animate-in fade-in-0 duration-1000 delay-500"
    >
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <EditableTitle
          tag="h2"
          id="upcomingCeremoniesTitle"
          initialValue={t('upcomingCeremoniesTitle')}
          className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
        />
        <EditableTitle
          tag="p"
          id="upcomingCeremoniesSubtitle"
          initialValue={t('upcomingCeremoniesSubtitle')}
          className="max-w-2xl text-lg text-foreground/80 font-body"
         />
         {isAdmin && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusCircle className="mr-2" />
            {t('addCeremony')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-8 justify-center">
        {ceremonies.map((ceremony) => (
          <Card
            key={ceremony.id}
            className={cn(`w-full max-w-sm flex flex-col rounded-2xl border-2 hover:border-primary/80 transition-all duration-300 group overflow-hidden`, 
              ceremony.featured
                ? 'border-primary shadow-[0_0_30px_-10px] shadow-primary/50 md:scale-105'
                : 'border-card-foreground/10'
            )}
          >
            <CardHeader className="p-0">
              <div className="relative aspect-video overflow-hidden pt-[56.25%]">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full z-20 bg-black/50 hover:bg-black/80 text-white"
                    onClick={() => setEditingCeremony(ceremony)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {ceremony.mediaUrl && (
                  <a href={ceremony.mediaUrl} target="_blank" rel="noopener noreferrer" className="absolute top-2 left-2 z-20">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                <VideoPlayer 
                  videoUrl={ceremony.mediaUrl} 
                  mediaType={ceremony.mediaType}
                  title={ceremony.title} 
                  className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </CardHeader>
            <div className="p-6 flex flex-col flex-1">
              <CardTitle className="text-2xl font-headline tracking-wide">
                {ceremony.title}
              </CardTitle>
              <CardDescription className="font-body text-base mt-2 flex-1">
                {ceremony.description}
              </CardDescription>
            <CardContent className="flex-1 space-y-4 mt-6 p-0">
            </CardContent>
            <CardFooter className="p-0 pt-6 flex flex-col gap-2">
              <Button
                onClick={() => handleViewPlans(ceremony)}
                className={cn(`w-full text-lg font-bold rounded-xl h-12`)}
                variant={'outline'}
              >
                {t('viewPlans')}
              </Button>
              <Button asChild className="w-full" variant="link">
                <Link
                  href={ceremony.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('bookSpot')}
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
       {viewingCeremony && (
        <CeremonyDetailsDialog
          ceremony={viewingCeremony}
          isOpen={!!viewingCeremony}
          onClose={() => setViewingCeremony(null)}
        />
      )}
    </section>
    </>
  );
}
