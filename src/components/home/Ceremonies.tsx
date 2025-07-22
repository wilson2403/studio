
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarIcon, Edit, ExternalLink, PlusCircle, ArrowRight } from 'lucide-react';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

const CeremonyCard = ({
    ceremony,
    isAdmin,
    onEdit,
    onViewPlans,
    activeVideo,
    setActiveVideo
}: {
    ceremony: Ceremony;
    isAdmin: boolean;
    onEdit: (ceremony: Ceremony) => void;
    onViewPlans: (ceremony: Ceremony) => void;
    activeVideo: string | null;
    setActiveVideo: (id: string | null) => void;
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

     useEffect(() => {
        if (ceremony.status !== 'active') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setActiveVideo(ceremony.id);
                }
            },
            { threshold: 0.6 } // Activate when 60% of the card is visible
        );

        const currentCardRef = cardRef.current;
        if (currentCardRef) {
            observer.observe(currentCardRef);
        }

        return () => {
            if (currentCardRef) {
                observer.unobserve(currentCardRef);
            }
        };
    }, [ceremony.id, setActiveVideo, ceremony.status]);


    return (
        <Card
            ref={cardRef}
            key={ceremony.id}
            className={cn(`w-full h-full flex flex-col rounded-2xl border-2 hover:border-primary/80 transition-all duration-300 group overflow-hidden`, 
              ceremony.featured
                ? 'border-primary shadow-[0_0_30px_-10px] shadow-primary/50'
                : 'border-card-foreground/10'
            )}
          >
            <CardHeader className="p-0">
              <div 
                className="relative aspect-[16/10.8] overflow-hidden"
              >
                 {isAdmin && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white"
                        onClick={(e) => {e.stopPropagation(); onEdit(ceremony)}}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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
                  isActivated={activeVideo === ceremony.id && ceremony.status === 'active'}
                />
              </div>
            </CardHeader>
            <div className="p-6 flex flex-col flex-1">
              <CardTitle className="text-2xl font-headline tracking-wide">
                {ceremony.title}
              </CardTitle>
               <div className="font-mono text-xs text-muted-foreground mt-2 space-y-1">
                {ceremony.date && (
                  <p className="flex items-center gap-1.5">
                    <CalendarIcon className='w-3 h-3'/> {ceremony.date}
                  </p>
                )}
              </div>
              <CardDescription className="font-body text-base mt-2 flex-1">
                {ceremony.description}
              </CardDescription>
            <CardContent className="flex-1 space-y-4 mt-6 p-0">
            </CardContent>
            <CardFooter className="p-0 pt-6 flex flex-col gap-2">
              <Button
                onClick={() => onViewPlans(ceremony)}
                className={cn(`w-full text-lg font-bold rounded-xl h-12`)}
              >
                {t('reserveWhatsapp')}
              </Button>
            </CardFooter>
            </div>
          </Card>
    );
}

export default function Ceremonies({ 
  status, 
  id,
  titleId,
  titleInitialValue,
  subtitleId,
  subtitleInitialValue
}: CeremoniesProps) {
  const [user, setUser] = useState<User | null>(null);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
  const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
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
        let ceremoniesData = await getCeremonies(status);
        
        if (ceremoniesData.length === 0 && status === 'active') {
            const allCeremonies = await getCeremonies();
            if (allCeremonies.length === 0) {
                 await seedCeremonies();
                 ceremoniesData = await getCeremonies(status);
            }
        }
        
        setCeremonies(ceremoniesData);

      } catch (error) {
        console.error("Failed to fetch ceremonies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCeremonies();
  }, [status]);

  const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
    // If status changed, remove from current list
    if (updatedCeremony.status !== status) {
        setCeremonies(ceremonies.filter(c => c.id !== updatedCeremony.id));
    } else {
        const ceremonyExists = ceremonies.some(c => c.id === updatedCeremony.id);
        if (ceremonyExists) {
            setCeremonies(ceremonies.map(c => c.id === updatedCeremony.id ? updatedCeremony : c));
        } else {
            setCeremonies([...ceremonies, updatedCeremony]);
        }
    }
    setEditingCeremony(null);
  };
  
  const handleCeremonyAdd = (newCeremony: Ceremony) => {
    if (newCeremony.status === status) {
        setCeremonies([...ceremonies, newCeremony]);
    }
    setIsAdding(false);
  }

  const handleCeremonyDelete = (id: string) => {
    setCeremonies(ceremonies.filter(c => c.id !== id));
    setEditingCeremony(null);
  }
  
  const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
     if(newCeremony.status === status) {
        setCeremonies([...ceremonies, newCeremony]);
     }
  }

  const handleViewPlans = (ceremony: Ceremony) => {
    if (user) {
      setViewingCeremony(ceremony);
    } else {
      router.push('/login');
    }
  };

  const isAdmin = user && user.email === ADMIN_EMAIL;
  
  const renderActiveCeremonies = () => (
     <div className="relative w-full max-w-6xl mx-auto">
        <Carousel
            opts={{
            align: 'center',
            loop: ceremonies.length > 3,
            }}
            className="w-full"
        >
            <CarouselContent className="-ml-4">
                {ceremonies.map((ceremony) => (
                    <CarouselItem key={ceremony.id} className="basis-2/3 md:basis-1/2 lg:basis-1/3 p-4">
                        <CeremonyCard
                            ceremony={ceremony}
                            isAdmin={!!isAdmin}
                            onEdit={setEditingCeremony}
                            onViewPlans={handleViewPlans}
                            activeVideo={activeVideo}
                            setActiveVideo={setActiveVideo}
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:-left-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" />
            <CarouselNext className="right-2 md:-right-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white"/>
        </Carousel>
    </div>
  );

  const renderFinishedCeremonies = () => (
     <div className="w-full">
          <div className="relative w-full max-w-6xl mx-auto">
            <Carousel
                opts={{
                align: 'center',
                loop: false,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2">
                {ceremonies.map((ceremony) => (
                    <CarouselItem key={ceremony.id} className="basis-2/3 md:basis-1/2 lg:basis-1/3 p-0 pl-2">
                      <div className="p-1 h-full">
                        <div className="relative rounded-2xl overflow-hidden aspect-[9/16] group/item shadow-2xl shadow-primary/20 border-2 border-primary/30 h-full">
                          {isAdmin && (
                            <div className="absolute top-2 right-2 z-20 flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); setEditingCeremony(ceremony); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                           <div className="absolute top-2 left-2 z-20 flex gap-2">
                              <a href={ceremony.mediaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                          </div>
                           <VideoPlayer 
                              videoUrl={ceremony.mediaUrl} 
                              mediaType={ceremony.mediaType}
                              title={ceremony.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                              isActivated={false} // Autoplay handled differently for carousels
                              inCarousel
                           />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                          <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white pointer-events-none">
                              <h3 className="text-lg md:text-xl font-headline">{ceremony.title}</h3>
                              <p className="font-body text-sm opacity-90 mt-1">{ceremony.description}</p>
                              {ceremony.date && (
                                <p className="font-mono text-xs opacity-70 mt-2 flex items-center gap-1.5"><CalendarIcon className='w-3 h-3'/> {ceremony.date}</p>
                              )}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 md:-left-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" />
                <CarouselNext className="right-2 md:-right-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white"/>
            </Carousel>
             <div className="mt-8 text-center">
                <Button asChild variant="outline">
                    <Link href="/ceremonies">
                        {t('viewAllEvents')}
                        <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        </div>
     </div>
  );

  if (loading) {
    return (
      <section id={id} className="container py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className="flex flex-col rounded-2xl border-2 border-card-foreground/10 h-[550px] bg-card/50"></Skeleton>
          ))}
        </div>
      </section>
    );
  }
  
  if (ceremonies.length === 0 && isAdmin) {
      return (
        <section id={id} className="container py-8 md:py-16 animate-in fade-in-0 duration-1000 delay-500">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                tag="h2"
                id={titleId}
                initialValue={titleInitialValue}
                className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
                 {isAdmin && (
                    <Button onClick={() => setIsAdding(true)}>
                        <PlusCircle className="mr-2" />
                        {t('addCeremony')}
                    </Button>
                )}
            </div>
            <p className="text-center text-muted-foreground">{t('noUpcomingCeremonies')}</p>
        </section>
      );
  }

  if (ceremonies.length === 0) {
      return null;
  }

  return (
    <>
    <section
      id={id}
      className="container py-8 md:py-16 animate-in fade-in-0 duration-1000 delay-500"
    >
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <EditableTitle
          tag="h2"
          id={titleId}
          initialValue={titleInitialValue}
          className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
        />
        {subtitleId && subtitleInitialValue && (
            <EditableTitle
                tag="p"
                id={subtitleId}
                initialValue={subtitleInitialValue}
                className="max-w-2xl text-lg text-foreground/80 font-body"
            />
        )}
         {isAdmin && status === 'active' && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusCircle className="mr-2" />
            {t('addCeremony')}
          </Button>
        )}
      </div>

      {status === 'active' ? renderActiveCeremonies() : renderFinishedCeremonies()}

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

interface CeremoniesProps {
    status: 'active' | 'finished' | 'inactive';
    id: string;
    titleId: string;
    titleInitialValue: string;
    subtitleId?: string;
    subtitleInitialValue?: string;
}

    

    



