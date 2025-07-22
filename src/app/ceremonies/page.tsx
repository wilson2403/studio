
'use client';

import { useEffect, useState } from 'react';
import { getCeremonies, Ceremony, seedCeremonies } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Expand, Edit, ExternalLink, ArrowRight, PlusCircle } from 'lucide-react';
import EditCeremonyDialog from '@/components/home/EditCeremonyDialog';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import VideoPopupDialog from '@/components/home/VideoPopupDialog';
import CeremonyDetailsDialog from '@/components/home/CeremonyDetailsDialog';
import { EditableTitle } from '@/components/home/EditableTitle';
import { EditableProvider } from '@/components/home/EditableProvider';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function AllCeremoniesPage() {
    const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
    const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
    const [expandedVideo, setExpandedVideo] = useState<Ceremony | null>(null);
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login?redirect=/ceremonies');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const fetchCeremonies = async () => {
            setPageLoading(true);
            try {
                const data = await getCeremonies(); // Get all ceremonies
                setCeremonies(data);
            } catch (error) {
                console.error("Failed to fetch ceremonies:", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchCeremonies();
    }, [user]);

    const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
        setCeremonies(prev => prev.map(c => c.id === updatedCeremony.id ? updatedCeremony : c));
        setEditingCeremony(null);
    };

    const handleCeremonyDelete = (id: string) => {
        setCeremonies(prev => prev.filter(c => c.id !== id));
        setEditingCeremony(null);
    };
    
    const handleCeremonyAdd = (newCeremony: Ceremony) => {
        setCeremonies(prev => [...prev, newCeremony].sort((a,b) => (a.date || '').localeCompare(b.date || '')));
        setIsAdding(false);
    }
    
    const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
        setCeremonies(prev => [...prev, newCeremony]);
    }

    const handleViewPlans = (ceremony: Ceremony) => {
        if (ceremony.registerRequired && !user) {
            router.push('/login');
        } else {
            setViewingCeremony(ceremony);
        }
    };

    const handleExpandVideo = (e: React.MouseEvent, ceremony: Ceremony) => {
        e.stopPropagation();
        setActiveVideo(null); // Stop the background video
        setExpandedVideo(ceremony);
    };

    const isAdmin = user && user.email === ADMIN_EMAIL;
    
    if (pageLoading) {
        return (
            <div className="container py-12 md:py-16 space-y-8">
                <Skeleton className="h-10 w-1/3 mx-auto" />
                <Skeleton className="h-8 w-2/3 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-96 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <Card className="w-full max-w-md text-center p-6">
                    <h2 className="text-2xl font-bold">{t('accessDenied')}</h2>
                    <p className="text-muted-foreground mt-2">{t('mustBeLoggedInToView')}</p>
                    <Button asChild className="mt-4">
                        <Link href="/login?redirect=/ceremonies">{t('signIn')}</Link>
                    </Button>
                </Card>
            </div>
        )
    }

    const activeCeremonies = ceremonies.filter(c => c.status === 'active');
    const pastCeremonies = ceremonies.filter(c => c.status === 'finished');
    const inactiveCeremonies = ceremonies.filter(c => c.status === 'inactive');

    const renderCeremonyGrid = (ceremonyList: Ceremony[], titleId: string, titleInitialValue: string) => (
        <section className="mb-16">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <EditableProvider>
                    <EditableTitle
                        tag="h2"
                        id={titleId}
                        initialValue={titleInitialValue}
                        className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                    />
                </EditableProvider>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-stretch justify-center">
                {ceremonyList.map((ceremony) => (
                  <div key={ceremony.id} className="px-5">
                    <Card 
                        onMouseEnter={() => setActiveVideo(ceremony.id)}
                        onMouseLeave={() => setActiveVideo(null)}
                        className="relative group/item flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card/50 h-full"
                    >
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
                        <div className="aspect-[9/16] h-[422px] overflow-hidden rounded-t-2xl relative group/video">
                             <VideoPlayer 
                                videoUrl={ceremony.mediaUrl} 
                                mediaType={ceremony.mediaType}
                                videoFit={ceremony.videoFit}
                                title={ceremony.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                                isActivated={activeVideo === ceremony.id && !expandedVideo}
                                inCarousel={false}
                             />
                        </div>
                        <CardContent className="p-4 bg-primary/10 rounded-b-lg text-center flex flex-col justify-center flex-grow">
                             <p className="font-mono text-xl font-bold text-white mb-2">
                                {ceremony.title}
                            </p>
                            {ceremony.status === 'active' ? (
                                <Button variant="default" className='w-full' onClick={() => handleViewPlans(ceremony)}>
                                {t('reserveNow')}
                                </Button>
                            ) : (
                                ceremony.date && <p className="text-sm text-white/70">{ceremony.date}</p>
                            )}
                        </CardContent>
                    </Card>
                  </div>
                ))}
            </div>
        </section>
    );

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('allCeremoniesTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('allCeremoniesSubtitle')}</p>
                 {isAdmin && (
                  <Button onClick={() => setIsAdding(true)} className="mt-4">
                    <PlusCircle className="mr-2" />
                    {t('addCeremony')}
                  </Button>
                )}
            </div>
            
            {activeCeremonies.length > 0 && renderCeremonyGrid(activeCeremonies, 'upcomingCeremoniesTitle', t('upcomingCeremoniesTitle'))}
            {pastCeremonies.length > 0 && renderCeremonyGrid(pastCeremonies, 'pastEventsTitle', t('pastEventsTitle'))}
            {isAdmin && inactiveCeremonies.length > 0 && renderCeremonyGrid(inactiveCeremonies, 'inactiveCeremoniesTitle', t('inactiveCeremoniesTitle'))}


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
        </div>
    );
}
