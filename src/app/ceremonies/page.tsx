
'use client';

import { useEffect, useState } from 'react';
import { getCeremonies, Ceremony, getUserProfile, incrementCeremonyReserveClick, getUsersForCeremony, UserProfile, logUserAction } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Expand, Edit, ExternalLink, ArrowRight, PlusCircle, CheckCircle, Eye, MousePointerClick, Users, Share2 } from 'lucide-react';
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

export default function AllCeremoniesPage() {
    const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
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
                setIsAuthorized(!!hasPermission);
                fetchCeremonies(!!hasPermission);
            } else {
                setIsAuthorized(false);
                fetchCeremonies(false);
            }
        });
        return () => unsubscribe();
    }, []);
    
    const fetchCeremonies = async (isUserAuthorized: boolean) => {
        setPageLoading(true);
        try {
            const data = await getCeremonies(); // Get all ceremonies
            // Filter inactive ones only if user is not authorized
            const visibleCeremonies = isUserAuthorized ? data : data.filter(c => c.status !== 'inactive');
            
             const decoratedCeremonies = await Promise.all(
                visibleCeremonies.map(async (ceremony) => {
                    const users = await getUsersForCeremony(ceremony.id);
                    return { ...ceremony, assignedUsers: users };
                })
            );
            setCeremonies(decoratedCeremonies);

        } catch (error) {
            console.error("Failed to fetch ceremonies:", error);
        } finally {
            setPageLoading(false);
        }
    };


    const handleCeremonyUpdate = (updatedCeremony: Ceremony) => {
        const ceremonyExists = ceremonies.some(c => c.id === updatedCeremony.id);
        if (ceremonyExists) {
            setCeremonies(prev => prev.map(c => c.id === updatedCeremony.id ? updatedCeremony : c));
        } else {
            setCeremonies(prev => [...prev, updatedCeremony]);
        }
        setEditingCeremony(null);
    };

    const handleCeremonyDelete = (id: string) => {
        setCeremonies(prev => prev.filter(c => c.id !== id));
        setEditingCeremony(null);
    };
    
    const handleCeremonyAdd = (newCeremony: Ceremony) => {
        setCeremonies(prev => [...prev, newCeremony].sort((a,b) => {
            const statusOrder = { active: 1, inactive: 2, finished: 3 };
            return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4) || (a.date || '').localeCompare(b.date || '');
        }));
        setIsAdding(false);
    }
    
    const handleCeremonyDuplicate = (newCeremony: Ceremony) => {
        setCeremonies(prev => [...prev, newCeremony]);
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

    const sortedCeremonies = [...ceremonies].sort((a, b) => {
        const aIsAssigned = userProfile?.assignedCeremonies?.some(c => c.ceremonyId === a.id);
        const bIsAssigned = userProfile?.assignedCeremonies?.some(c => c.ceremonyId === b.id);

        if (aIsAssigned && !bIsAssigned) return -1;
        if (!aIsAssigned && bIsAssigned) return 1;

        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;

        const statusOrder = { 'active': 1, 'inactive': 2, 'finished': 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }

        return 0; // maintain original order if all else is equal
    });

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('allCeremoniesPageTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">
                    {t('allCeremoniesPageSubtitle')}
                </p>
                {isAuthorized && (
                <Button onClick={() => setIsAdding(true)} className="mt-4">
                    <PlusCircle className="mr-2" />
                    {t('addCeremony')}
                </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-stretch justify-center">
                {sortedCeremonies.map((ceremony) => {
                    const registeredCount = ceremony.assignedUsers?.length || 0;
                    const statusVariant = ceremony.status === 'active' ? 'success' : ceremony.status === 'inactive' ? 'warning' : 'secondary';
                    const isAssigned = userProfile?.assignedCeremonies?.some(c => c.ceremonyId === ceremony.id);

                    return (
                        <div key={ceremony.id} className="px-5">
                            <Card 
                                className="relative group/item flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 bg-card/50 h-full"
                            >
                                <div className="absolute top-2 right-2 z-20 flex gap-2">
                                    {isAuthorized && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => { e.stopPropagation(); setEditingCeremony(ceremony); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>}
                                    {ceremony.status === 'active' && 
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white">
                                            <Link href={`/ceremonias/${ceremony.id}`}><Share2 className="h-4 w-4" /></Link>
                                        </Button>
                                    }
                                </div>
                                <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 items-start">
                                    {isAuthorized && <Badge variant={statusVariant} className="capitalize">{t(ceremony.status)}</Badge>}
                                    {isAssigned && <Badge variant="success"><CheckCircle className="mr-2 h-4 w-4"/>{t('enrolled')}</Badge>}
                                    <div className='flex gap-2'>
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
                                            {isAssigned ? t('viewDetails') : t('reserveNow')}
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
                    videoUrl={expandedVideo.mediaUrl}
                    mediaType={expandedVideo.mediaType}
                    title={expandedVideo.title}
                />
            )}
        </div>
    );
