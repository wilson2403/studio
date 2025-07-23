
'use client';

import { Button } from '@/components/ui/button';
import { Edit, ExternalLink, PlusCircle, ArrowRight, Expand, Eye, MousePointerClick, RotateCcw, Users } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCeremonies, Ceremony, seedCeremonies, incrementCeremonyReserveClick, getUserProfile, resetCeremonyCounters, getUsersForCeremony } from '@/lib/firebase/firestore';
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
import VideoPopupDialog from './VideoPopupDialog';
import { Card, CardContent } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function Ceremonies({ 
  status, 
  id,
  titleId,
  titleInitialValue,
  subtitleId,
  subtitleInitialValue
}: CeremoniesProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
  const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<Ceremony | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
          const profile = await getUserProfile(currentUser.uid);
          setIsAdmin(!!profile?.isAdmin || currentUser.email === ADMIN_EMAIL);
      } else {
          setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAndDecorateCeremonies = async () => {
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
        
        // Decorate with user counts
        if (status === 'active') {
          const decoratedCeremonies = await Promise.all(
            ceremoniesData.map(async (ceremony) => {
              const users = await getUsersForCeremony(ceremony.id);
              return { ...ceremony, assignedUsers: users };
            })
          );
          setCeremonies(decoratedCeremonies);
        } else {
          setCeremonies(ceremoniesData);
        }

      } catch (error) {
        console.error("Failed to fetch ceremonies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndDecorateCeremonies();
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
    if (!isAdmin) {
      incrementCeremonyReserveClick(ceremony.id);
    }

    if (ceremony.registerRequired && !user) {
       toast({
          title: t('authRequiredTitle'),
          description: t('authRequiredDescription'),
          action: (
              <Button asChild><Link href="/login">{t('signIn')}</Link></Button>
          )
      })
    } else {
      setViewingCeremony(ceremony);
    }
  };

  const handleExpandVideo = (e: React.MouseEvent, ceremony: Ceremony) => {
    e.stopPropagation();
    setActiveVideo(null); // Stop the background video
    setExpandedVideo(ceremony);
  };
  
  const renderActiveCeremonies = () => (
    <div className="w-full justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
            {ceremonies.map((ceremony) => {
              const registeredCount = ceremony.assignedUsers?.length || 0;
              return (
                <div key={ceremony.id} className="px-5">
                  <Card 
                      onMouseEnter={() => setActiveVideo(ceremony.id)}
                      onMouseLeave={() => setActiveVideo(null)}
                      className="relative group/item flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card/50"
                  >
                      {isAdmin && (
                        <div className="absolute top-2 right-2 z-20 flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); setEditingCeremony(ceremony); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 items-start">
                          <div className="flex gap-2">
                            {ceremony.mediaUrl && (
                              <a href={ceremony.mediaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => handleExpandVideo(e, ceremony)}>
                              <Expand className="h-4 w-4" />
                            </Button>
                          </div>
                      </div>
                      <div className="aspect-[4/5] overflow-hidden rounded-t-2xl relative group/video">
                           <VideoPlayer 
                              ceremonyId={ceremony.id}
                              videoUrl={ceremony.mediaUrl} 
                              mediaType={ceremony.mediaType}
                              videoFit={ceremony.videoFit}
                              title={ceremony.title}
                              isActivated={activeVideo === ceremony.id && !expandedVideo}
                              inCarousel={false}
                           />
                      </div>
                      <CardContent className="p-4 bg-primary/10 rounded-b-lg text-center flex flex-col justify-center">
                           <p className="font-mono text-xl font-bold text-white mb-2">
                              {ceremony.title}
                          </p>
                          <div className="flex items-center justify-center gap-2 text-white/80 mb-4 text-sm">
                              <Users className="h-4 w-4" />
                              <span>{t('registeredCount', { count: registeredCount })}</span>
                          </div>
                          <Button variant="default" className='w-full' onClick={() => handleViewPlans(ceremony)}>
                            {t('reserveNow')}
                          </Button>
                          {isAdmin && (
                            <div className="flex justify-center gap-4 text-xs text-white/70 mt-3 pt-3 border-t border-white/20">
                                <div className='flex items-center gap-1.5'>
                                    <Eye className="h-4 w-4" />
                                    <span>{ceremony.viewCount || 0}</span>
                                </div>
                                <div className='flex items-center gap-1.5'>
                                    <MousePointerClick className="h-4 w-4" />
                                    <span>{ceremony.reserveClickCount || 0}</span>
                                </div>
                            </div>
                           )}
                      </CardContent>
                  </Card>
                </div>
              )
            })}
        </div>
    </div>
  );

  const renderFinishedCeremonies = () => (
     <div className="w-full">
        <Carousel
            opts={{
              align: 'center',
              loop: false,
            }}
            className="w-full"
        >
            <CarouselContent className="-ml-2 md:-ml-4">
            {ceremonies.map((ceremony) => (
                <CarouselItem key={ceremony.id} className="basis-full md:basis-1/2 lg:basis-1/3 p-0 px-5">
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
                          {ceremony.mediaUrl && (
                            <a href={ceremony.mediaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => handleExpandVideo(e, ceremony)}>
                              <Expand className="h-4 w-4" />
                          </Button>
                      </div>
                       <VideoPlayer
                          ceremonyId={ceremony.id}
                          videoUrl={ceremony.mediaUrl} 
                          mediaType={ceremony.mediaType}
                          videoFit={ceremony.videoFit}
                          title={ceremony.title}
                          isActivated={true}
                          inCarousel
                          defaultMuted={false}
                       />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none transition-colors duration-300"></div>
                      <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white pointer-events-none w-full">
                          <h3 className="text-lg md:text-xl font-headline">{ceremony.title}</h3>
                           {ceremony.date && (
                            <p className="font-mono text-xs opacity-70 mt-1">{ceremony.date}</p>
                          )}
                           {isAdmin && (
                            <div className="flex justify-start gap-4 text-xs text-white/70 mt-3 pt-3 border-t border-white/20">
                                <div className='flex items-center gap-1.5'>
                                    <Eye className="h-4 w-4" />
                                    <span>{ceremony.viewCount || 0}</span>
                                </div>
                                <div className='flex items-center gap-1.5'>
                                    <MousePointerClick className="h-4 w-4" />
                                    <span>{ceremony.reserveClickCount || 0}</span>
                                </div>
                            </div>
                           )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 sm:-left-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" />
            <CarouselNext className="right-2 sm:-right-8 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white"/>
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
  );

  if (loading) {
    const skeletonClass = status === 'active' ? 'aspect-[4/5]' : 'aspect-[9/16]';
    return (
      <section id={id} className="container py-8 md:py-16">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <Skeleton className="h-12 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className={cn('w-full', skeletonClass)} />
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
      {expandedVideo && (
        <VideoPopupDialog
            isOpen={!!expandedVideo}
            onClose={() => setExpandedVideo(null)}
            videoUrl={expandedVideo.mediaUrl}
            mediaType={expandedVideo.mediaType}
            title={expandedVideo.title}
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

