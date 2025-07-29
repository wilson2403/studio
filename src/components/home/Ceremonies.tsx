
'use client';

import { Button } from '@/components/ui/button';
import { Edit, ExternalLink, PlusCircle, ArrowRight, Expand, Eye, MousePointerClick, RotateCcw, Users, Calendar, Clock, Share2, Download, Video } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCeremonies, Ceremony, seedCeremonies, incrementCeremonyReserveClick, getUserProfile, resetCeremonyCounters, getUsersForCeremony, UserProfile, logUserAction } from '@/lib/firebase/firestore';
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

export default function Ceremonies({ 
  status, 
  id,
  titleId,
  titleInitialValue,
  subtitleId,
  subtitleInitialValue,
  hideDownloadButton = false,
}: CeremoniesProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
  const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<Ceremony | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
          const hasPermission = profile?.role === 'admin' || (profile?.role === 'organizer' && !!profile?.permissions?.canEditCeremonies);
          setIsAuthorized(hasPermission);
      } else {
          setIsAuthorized(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAndDecorateCeremonies = async () => {
      setLoading(true);
      try {
        let ceremoniesData: Ceremony[] = [];
        
        if (status === 'active') {
          ceremoniesData = await getCeremonies('active');
        } else if (status === 'finished') { // Special logic for "past events"
            const allCeremonies = await getCeremonies(); // Fetch all
            ceremoniesData = allCeremonies
                .filter(c => c.status === 'finished' || c.status === 'inactive')
                .sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    
                    const statusOrder = { finished: 1, inactive: 2 };
                    const getOrder = (c: Ceremony) => statusOrder[c.status] || 3;
                    return getOrder(a) - getOrder(b);
                });
        }

        if (ceremoniesData.length === 0 && status === 'active') {
            const allCeremonies = await getCeremonies();
            if (allCeremonies.length === 0) {
                 await seedCeremonies();
                 ceremoniesData = await getCeremonies(status);
                 ceremoniesData = ceremoniesData.filter(c => c.status !== 'inactive');
            }
        }
        
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
    if (!isAuthorized) {
      incrementCeremonyReserveClick(ceremony.id);
      logUserAction('click_ceremony_details', { targetId: ceremony.id, targetType: 'ceremony' });
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
      router.push(`/ceremonias/${ceremony.id}`);
    }
  };

  const handleExpandVideo = (e: React.MouseEvent, ceremony: Ceremony) => {
    e.stopPropagation();
    setExpandedVideo(ceremony);
  };
  
  const handleShare = async (ceremony: Ceremony) => {
      const shareUrl = `${window.location.origin}/artesanar/${ceremony.id}`;
      const shareText = t('shareCeremonyMemoryText', { title: ceremony.title });
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

      if (navigator.share) {
        try {
            await navigator.share({
                title: ceremony.title,
                text: shareText,
                url: shareUrl,
            });
        } catch (error) {
            window.open(whatsappUrl, '_blank');
        }
    } else {
        window.open(whatsappUrl, '_blank');
    }
  };

  const renderActiveCeremonies = () => {
    const isDirectVideoUrl = (url: string | undefined): boolean => {
        if (!url) return false;
        return url.startsWith('/') || /\.(mp4|webm|ogg)$/.test(url.split('?')[0]) || url.includes('githubusercontent');
    };

    return (
        <div className="w-full justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
                {ceremonies.map((ceremony) => {
                  const registeredCount = ceremony.assignedUsers?.length || 0;
                  const isAssigned = userProfile?.assignedCeremonies?.some(c => (typeof c === 'string' ? c : c.ceremonyId) === ceremony.id);
                  const showExternalLink = ceremony.mediaUrl && !isDirectVideoUrl(ceremony.mediaUrl);
                  return (
                    <div key={ceremony.id} className="px-5">
                      <Card 
                          className="relative group/item flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card/50"
                      >
                          <div className="absolute top-2 right-2 z-20 flex gap-2">
                            {isAuthorized && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); setEditingCeremony(ceremony); }}>
                              <Edit className="h-4 w-4" />
                            </Button>}
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); handleShare(ceremony); }}>
                                <Share2 className="h-4 w-4" />
                             </Button>
                          </div>
                          <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 items-start">
                              <div className="flex gap-2">
                                {showExternalLink && (
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
                                  autoplay={ceremony.autoplay}
                                  defaultMuted={ceremony.defaultMuted}
                               />
                          </div>
                          <CardContent className="p-4 bg-primary/10 rounded-b-lg text-center flex flex-col justify-center">
                               <p className="font-mono text-xl font-bold text-white mb-2">
                                  {ceremony.title}
                              </p>
                              {ceremony.showParticipantCount && (
                                <div className="flex items-center justify-center gap-2 text-white/80 mb-4 text-sm">
                                    <Users className="h-4 w-4" />
                                    <span>{t('registeredCount', { count: registeredCount })}</span>
                                </div>
                              )}
                               <Button variant="default" className="w-full" onClick={() => handleViewPlans(ceremony)}>
                                   {isAssigned ? t('buttonViewDetails') : t('reserveNow')}
                               </Button>
                              {isAuthorized && (
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
  };

  const renderFinishedCeremonies = () => {
    return (
     <div className="w-full relative">
        <Carousel
            opts={{
              align: 'center',
              loop: false,
            }}
            className="w-full"
        >
            <CarouselContent className="-ml-2 md:-ml-4">
            {ceremonies.map((ceremony, index) => {
              const isAssigned = userProfile?.assignedCeremonies?.some(c => (typeof c === 'string' ? c : c.ceremonyId) === ceremony.id);
              return (
                <CarouselItem key={ceremony.id} className="basis-full md:basis-1/2 lg:basis-1/3 p-0 px-2">
                  <div className="p-1 h-full">
                    <div className="relative rounded-2xl overflow-hidden aspect-[9/16] group/item shadow-2xl shadow-primary/20 border-2 border-primary/30 h-full">
                      {isAuthorized && (
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
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); handleShare(ceremony); }}>
                            <Share2 className="h-4 w-4" />
                         </Button>
                           {!hideDownloadButton && ceremony.downloadUrl && isAssigned && (
                                <a href={ceremony.downloadUrl} target="_blank" rel="noopener noreferrer" download onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                      </div>
                       <VideoPlayer
                          ceremonyId={ceremony.id}
                          videoUrl={ceremony.mediaUrl} 
                          mediaType={ceremony.mediaType}
                          videoFit={ceremony.videoFit}
                          title={ceremony.title}
                          autoplay={ceremony.autoplay}
                          defaultMuted={ceremony.defaultMuted}
                       />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none transition-colors duration-300"></div>
                      <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white pointer-events-none w-full">
                          <h3 className="text-lg md:text-xl font-headline">{ceremony.title}</h3>
                          {ceremony.date && (
                            <p className="absolute bottom-4 right-4 text-white/90 text-sm font-mono bg-black/30 p-1.5 rounded-md">
                                {ceremony.date}
                            </p>
                           )}
                      </div>
                       {isAuthorized && (
                        <div className="absolute bottom-16 right-4 flex-col justify-start gap-4 text-xs text-white/70 mt-3 pt-3">
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
                </CarouselItem>
              )
            })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-4 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white" />
            <CarouselNext className="hidden md:flex right-4 bg-black/50 text-white border-white/20 hover:bg-black/70 hover:text-white"/>
            <div className="md:hidden mt-4 flex justify-center gap-4">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
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
  }

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
  
  if (ceremonies.length === 0 && isAuthorized) {
      return (
        <section id={id} className="container py-8 md:py-16 animate-in fade-in-0 duration-1000 delay-500">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableTitle
                tag="h2"
                id={titleId}
                initialValue={titleInitialValue}
                className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                />
                 {isAuthorized && (
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
      className={cn("container py-8 md:py-16 animate-in fade-in-0 duration-1000 delay-500", status === 'finished' && 'pb-24')}
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
         {isAuthorized && status === 'active' && (
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
            ceremonyId={expandedVideo.id}
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
    hideDownloadButton?: boolean;
}



