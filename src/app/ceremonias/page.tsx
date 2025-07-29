
'use client';

import { useEffect, useState } from 'react';
import { getCeremonies, Ceremony, getUserProfile, incrementCeremonyReserveClick, getUsersForCeremony, UserProfile, logUserAction } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Expand, Edit, ExternalLink, ArrowRight, PlusCircle, CheckCircle, Eye, MousePointerClick, Users, Share2, Download, Video } from 'lucide-react';
import EditCeremonyDialog from '@/components/home/EditCeremonyDialog';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import VideoPopupDialog from '@/components/home/VideoPopupDialog';
import CeremonyDetailsDialog from '@/components/home/CeremonyDetailsDialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';
import { SystemSettings } from '@/types';
import { getSystemSettings } from '@/ai/flows/settings-flow';

export default function AllCeremoniesPage() {
    const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null);
    const [viewingCeremony, setViewingCeremony] = useState<Ceremony | null>(null);
    const [expandedVideo, setExpandedVideo] = useState<Ceremony | null>(null);
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [componentButtons, setComponentButtons] = useState<SystemSettings['componentButtons'] | null>(null);
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
                const hasPermission = profile?.role === 'admin' || (profile?.role === 'organizer' && !!profile?.permissions?.canEditCeremonies);
                setIsAuthorized(!!hasPermission);
                fetchCeremonies(!!hasPermission, profile);
            } else {
                setIsAuthorized(false);
                fetchCeremonies(false);
            }
        });
        
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();
                setComponentButtons(settings.componentButtons);
            } catch (error) {
                console.error("Failed to fetch button settings:", error);
            }
        };
        fetchSettings();

        return () => unsubscribe();
    }, []);

    const fetchCeremonies = async (isUserAuthorized: boolean, profile: UserProfile | null = null) => {
        setPageLoading(true);
        try {
            const data = await getCeremonies(); // Get all ceremonies
            // Filter inactive ones only if user is not authorized
            let visibleCeremonies = isUserAuthorized ? data : data.filter(c => c.status !== 'inactive');
            
            if (isUserAuthorized) {
                 visibleCeremonies = await Promise.all(
                    visibleCeremonies.map(async (ceremony) => {
                        const users = await getUsersForCeremony(ceremony.id);
                        return { ...ceremony, assignedUsers: users };
                    })
                );
            }
            
            const sorted = sortCeremonies(visibleCeremonies, profile);

            setCeremonies(sorted);

        } catch (error) {
            console.error("Failed to fetch ceremonies:", error);
        } finally {
            setPageLoading(false);
        }
    };

    const sortCeremonies = (ceremoniesToSort: Ceremony[], profile: UserProfile | null): Ceremony[] => {
        return [...ceremoniesToSort].sort((a, b) => {
            const aIsAssigned = profile?.assignedCeremonies?.some(c => (typeof c === 'string' ? c : c.ceremonyId) === a.id) || false;
            const bIsAssigned = profile?.assignedCeremonies?.some(c => (typeof c === 'string' ? c : c.ceremonyId) === b.id) || false;

            if (aIsAssigned && !bIsAssigned) return -1;
            if (!aIsAssigned && bIsAssigned) return 1;

            const statusOrder = { 'active': 1, 'finished': 3, 'inactive': 4 };

            if (a.status !== b.status) {
                 return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            }

            if (a.status === 'active') {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
            }

            return 0;
        });
    }


    const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
        const ceremonyExists = ceremonies.some(c => c.id === updatedCeremony.id);
        if (ceremonyExists) {
            setCeremonies(prev => sortCeremonies(prev.map(c => c.id === updatedCeremony.id ? updatedCeremony : c), userProfile));
        } else {
            setCeremonies(prev => sortCeremonies([...prev, updatedCeremony], userProfile));
        }
        setEditingCeremony(null);
    };

    const handleCeremonyDelete = (id: string) => {
        setCeremonies(prev => prev.filter(c => c.id !== id));
        setEditingCeremony(null);
    };
    
    const handleCeremonyAdd = (newCeremony: Ceremony) => {
        setCeremonies(prev => sortCeremonies([...prev, newCeremony], userProfile));
        setIsAdding(false);
    }
    
    const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
        setCeremonies(prev => sortCeremonies([...prev, newCeremony], userProfile));
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
        setActiveVideo(null); // Stop the background video
        setExpandedVideo(ceremony);
    };
    
    const handleShare = async (ceremony: Ceremony) => {
        const shareUrl = `${window.location.origin}/ceremonias/${ceremony.slug || ceremony.id}`;
        const shareText = t('shareCeremonyText', { title: ceremony.title });
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

    const getButtonText = (key: keyof SystemSettings['componentButtons'], fallback: string) => {
        const lang = i18n.language as 'es' | 'en';
        if (!componentButtons) return t(fallback);
        return componentButtons[key]?.[lang] || componentButtons[key]?.es || t(fallback);
    };


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
    
    if (!user && !pageLoading) {
        return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>{t('authRequiredJourneyTitle')}</CardTitle>
                        <CardDescription>{t('authRequiredCeremoniesDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                        <Button asChild className="w-full">
                            <Link href="/login?redirect=/ceremonies">{t('signIn')}</Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/register?redirect=/ceremonies">{t('registerButton')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <EditableProvider>
            <div className="container py-12 md:py-16 space-y-12">
                <div className="text-center">
                    {isAuthorized ? (
                        <>
                            <EditableTitle
                                tag="h1"
                                id="ceremoniesPageTitle"
                                initialValue={t('allCeremoniesPageTitle')}
                                className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                            />
                            <EditableTitle
                                tag="p"
                                id="ceremoniesPageSubtitle"
                                initialValue={t('allCeremoniesPageSubtitle')}
                                className="mt-2 text-lg text-foreground/80 font-body"
                            />
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">{t('allCeremoniesPageTitle')}</h1>
                            <p className="mt-2 text-lg text-foreground/80 font-body">{t('allCeremoniesPageSubtitle')}</p>
                        </>
                    )}
                    {isAuthorized && (
                    <Button onClick={() => setIsAdding(true)} className="mt-4">
                        <PlusCircle className="mr-2" />
                        {getButtonText('addCeremony', 'addCeremony')}
                    </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-stretch justify-center">
                    {ceremonies.map((ceremony) => {
                        const registeredCount = ceremony.assignedUsers?.length || 0;
                        const statusVariant = ceremony.status === 'active' ? 'success' : ceremony.status === 'inactive' ? 'warning' : 'secondary';
                        const statusText = t(`status${ceremony.status.charAt(0).toUpperCase() + ceremony.status.slice(1)}`);
                        const isAssigned = userProfile?.assignedCeremonies?.some(c => (typeof c === 'string' ? c : c.ceremonyId) === ceremony.id);
                        const isDirectVideoUrl = (url: string | undefined): boolean => {
                            if (!url) return false;
                            return url.startsWith('/') || /\.(mp4|webm|ogg)$/.test(url.split('?')[0]) || url.includes('githubusercontent');
                        };
                        
                        const isFinishedMemory = ceremony.status === 'finished' && isAssigned && ceremony.downloadUrl;
                        const videoUrlToShow = isFinishedMemory ? ceremony.downloadUrl : ceremony.mediaUrl;
                        const showExternalLink = videoUrlToShow && !isDirectVideoUrl(videoUrlToShow);

                        return (
                            <div key={ceremony.id} className="px-5">
                                <Card 
                                    onMouseEnter={() => setActiveVideo(ceremony.id)}
                                    onMouseLeave={() => setActiveVideo(null)}
                                    className="relative group/item flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card/50 h-full"
                                >
                                    <div className="absolute top-2 right-2 z-20 flex gap-2">
                                        {isAuthorized && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); setEditingCeremony(ceremony); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>}
                                        {ceremony.status === 'active' && 
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); handleShare(ceremony); }}>
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                        }
                                    </div>
                                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 items-start">
                                        {isAuthorized && <Badge variant={statusVariant} className="capitalize">{statusText}</Badge>}
                                        {isAssigned && <Badge variant="success"><CheckCircle className="mr-2 h-4 w-4"/>{t('enrolled')}</Badge>}
                                        <div className='flex gap-2'>
                                            {showExternalLink && (
                                                <a href={videoUrlToShow} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                </a>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => handleExpandVideo(e, ceremony)}>
                                                <Expand className="h-4 w-4" />
                                            </Button>
                                             {ceremony.status !== 'active' && ceremony.downloadUrl && isAssigned && (
                                                <a href={ceremony.downloadUrl} target="_blank" rel="noopener noreferrer" download onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="aspect-[4/5] overflow-hidden rounded-t-2xl relative group/video">
                                        <VideoPlayer 
                                            ceremonyId={ceremony.id}
                                            videoUrl={videoUrlToShow} 
                                            mediaType={ceremony.mediaType}
                                            videoFit={ceremony.videoFit}
                                            title={ceremony.title}
                                            autoplay={ceremony.autoplay}
                                            defaultMuted={ceremony.defaultMuted}
                                        />
                                    </div>
                                    <CardContent className="p-4 bg-primary/10 rounded-b-lg text-center flex flex-col justify-center flex-grow">
                                        <p className="font-mono text-xl font-bold text-white mb-2">
                                            {ceremony.title}
                                        </p>
                                        {isAuthorized && ceremony.showParticipantCount && (
                                            <div className="flex items-center justify-center gap-2 text-white/80 mb-4 text-sm">
                                                <Users className="h-4 w-4" />
                                                <span>{t('registeredCount', { count: registeredCount })}</span>
                                            </div>
                                        )}
                                        {ceremony.status === 'active' ? (
                                             <Button variant="default" className='w-full' onClick={() => handleViewPlans(ceremony)}>
                                                {isAssigned ? getButtonText('buttonViewDetails', 'Ver Detalles') : t('reserveNow')}
                                            </Button>
                                        ) : ceremony.status === 'finished' ? (
                                            <Button asChild variant="default" className='w-full'>
                                                <Link href={`/artesanar/${ceremony.id}`}>
                                                  <Video className="mr-2 h-4 w-4"/>
                                                  {t('viewMemory')}
                                                </Link>
                                            </Button>
                                        ) : (
                                            ceremony.date && <p className="text-sm text-white/70">{ceremony.date}</p>
                                        )}
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
                        videoUrl={expandedVideo.downloadUrl || expandedVideo.mediaUrl}
                        mediaType={expandedVideo.mediaType}
                        title={expandedVideo.title}
                    />
                )}
            </div>
        </EditableProvider>
    );
}
