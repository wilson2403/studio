

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony, getUserProfile, UserProfile, incrementCeremonyDownloadCount, logUserAction, getUsersForCeremony, assignCeremonyToUser } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download, Home, MessageSquare, Share2, Users } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { EditableProvider } from '@/components/home/EditableProvider';
import TestimonialDialog from '@/components/admin/TestimonialDialog';
import { SystemSettings } from '@/types';
import { getSystemSettings } from '@/ai/flows/settings-flow';
import ViewParticipantsDialog from '@/components/admin/ViewParticipantsDialog';
import { getFirebaseServices } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';

export default function CeremonyMemoryPage() {
    const [ceremony, setCeremony] = useState<Ceremony | null>(null);
    const [participants, setParticipants] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [componentButtons, setComponentButtons] = useState<SystemSettings['componentButtons'] | null>(null);
    const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false);
    
    const params = useParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const id = params.id as string;
    const { toast } = useToast();

    const isAssignedToCeremony = userProfile?.assignedCeremonies?.some(ac => {
        const ceremonyId = typeof ac === 'string' ? ac : ac.ceremonyId;
        return ceremonyId === ceremony?.id;
    }) || false;

    useEffect(() => {
        const fetchCeremonyData = async (currentUser: User | null) => {
            if (id) {
                setLoading(true);
                try {
                    const data = await getCeremonyById(id);
                    setCeremony(data);

                    if (data) {
                         const profile = currentUser ? await getUserProfile(currentUser.uid) : null;
                        const isAssigned = profile?.assignedCeremonies?.some(ac => (typeof ac === 'string' ? ac : ac.ceremonyId) === data.id);

                        if (isAssigned) {
                            const ceremonyParticipants = await getUsersForCeremony(data.id);
                            setParticipants(ceremonyParticipants);
                        }

                        if(profile?.role !== 'admin') {
                            // This is handled by the VideoPlayer now
                            // logUserAction('navigate_to_page', { targetId: data.slug, targetType: 'ceremony_memory' });
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch ceremony", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();
                setComponentButtons(settings.componentButtons);
            } catch (error) {
                console.error("Failed to fetch button settings:", error);
            }
        };

        const setupAuthListener = async () => {
            const { auth } = await getFirebaseServices();
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    const profile = await getUserProfile(currentUser.uid);
                    setUserProfile(profile);
                } else {
                    setUserProfile(null);
                }
                await fetchCeremonyData(currentUser);
            });
            return unsubscribe;
        };
        
        const unsubscribePromise = setupAuthListener();
        fetchSettings();
        
        return () => {
            unsubscribePromise.then(unsubscribe => unsubscribe());
        };
    }, [id]);
    
    const getButtonText = (key: keyof SystemSettings['componentButtons'], fallback: string) => {
        const lang = i18n.language as 'es' | 'en';
        if (!componentButtons) return t(fallback);
        const button = componentButtons[key];
        if (button && typeof button === 'object' && 'es' in button) {
             return button[lang] || button.es || t(fallback);
        }
        return t(fallback);
    };

    const handleShare = async () => {
        if (!ceremony) return;
        const shareUrl = `${window.location.origin}/artesanar/${ceremony.slug || ceremony.id}`;
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
    
    const handleAuthAction = (callback: () => void) => {
        if (user) {
            callback();
        } else {
            toast({
                title: t('authRequiredTitle'),
                description: t('authRequiredActionDescription'),
                action: <Button asChild><Link href={`/login?redirect=/artesanar/${id}`}>{t('signIn')}</Link></Button>
            });
        }
    };

    const handleDownload = () => {
        handleAuthAction(async () => {
            if (!ceremony?.downloadUrl || !user || !userProfile) return;

            // Assign ceremony if not already assigned
            if (!isAssignedToCeremony) {
                await assignCeremonyToUser(user.uid, ceremony.id);
                // Optimistically update local profile state
                setUserProfile(prev => ({
                    ...prev!,
                    assignedCeremonies: [...(prev?.assignedCeremonies || []), ceremony.id]
                }));
                 toast({ title: t('ceremonyAssignedSuccess') });
            }

            if (userProfile?.role !== 'admin' && userProfile?.role !== 'organizer') {
                incrementCeremonyDownloadCount(ceremony.id);
                logUserAction('download_ceremony_memory', {
                    targetId: ceremony.id,
                    targetType: 'ceremony',
                    changes: { role: userProfile?.role }
                });
            }
            
            const link = document.createElement('a');
            link.href = ceremony.downloadUrl;
            link.download = `${ceremony.title}-recuerdo.mp4`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    if (loading) {
        return (
            <div className="container py-8">
                <Skeleton className="w-full aspect-video mb-8" />
                <div className="max-w-2xl mx-auto space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (!ceremony) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-4">
                <h1 className="text-2xl font-bold mb-4">{t('ceremonyNotFound')}</h1>
                <Button asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        {t('goHome')}
                    </Link>
                </Button>
            </div>
        );
    }
    
    const isShortVideo = ceremony.mediaType === 'short video';


    return (
        <EditableProvider>
            <div className="container pt-8 md:pt-12">
                 <div className="max-w-4xl mx-auto">
                    <div className={cn(
                        "w-full mb-8 rounded-lg overflow-hidden shadow-2xl bg-black",
                        isShortVideo ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-video"
                    )}>
                        <VideoPlayer
                            ceremonyId={ceremony.id}
                            videoUrl={ceremony.mediaUrl}
                            mediaType={ceremony.mediaType}
                            videoFit="contain"
                            title={ceremony.title}
                            autoplay={true}
                            defaultMuted={false}
                            className="w-full h-full"
                        />
                    </div>
                
                    <div className="max-w-2xl mx-auto text-center">
                         <h1 className="text-4xl lg:text-5xl font-headline mb-4 text-primary drop-shadow-lg">{ceremony.title}</h1>
                        <div className="font-mono text-sm mb-6 space-y-1 text-muted-foreground">
                            {ceremony.date && (
                            <p className="flex items-center gap-2 justify-center">
                                <CalendarIcon className='w-4 h-4'/> {ceremony.date}
                            </p>
                            )}
                        </div>
                    
                        <div className="w-full max-w-xs mx-auto space-y-3">
                            <Button size="lg" className="w-full" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                {getButtonText('downloadVideo', 'Descargar Video')}
                            </Button>
                            {ceremony && (
                                <TestimonialDialog user={user} ceremony={ceremony}>
                                    <Button variant="outline" size="lg" className="w-full" onClick={(e) => {if (!user) { e.preventDefault(); handleAuthAction(() => {});}}}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        {getButtonText('leaveTestimonial', 'Dejar Testimonio')}
                                    </Button>
                                </TestimonialDialog>
                            )}
                             {isAssignedToCeremony && participants.length > 0 && (
                                <Button variant="outline" size="lg" className="w-full" onClick={() => setIsParticipantsDialogOpen(true)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    {getButtonText('viewParticipants', 'Ver Participantes')}
                                </Button>
                            )}
                            <Button variant="ghost" size="lg" className="w-full" onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                {getButtonText('shareCeremony', 'Compartir Ceremonia')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
             {ceremony && (
                <ViewParticipantsDialog
                    isOpen={isParticipantsDialogOpen}
                    onClose={() => setIsParticipantsDialogOpen(false)}
                    ceremony={{ ...ceremony, assignedUsers: participants }}
                />
            )}
        </EditableProvider>
    );
}
