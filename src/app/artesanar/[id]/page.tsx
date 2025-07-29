
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony, logUserAction } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download, Expand, Home, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { EditableProvider } from '@/components/home/EditableProvider';
import TestimonialDialog from '@/components/admin/TestimonialDialog';
import { getUserProfile, UserProfile } from '@/lib/firebase/firestore';
import { SystemSettings } from '@/types';
import { getSystemSettings } from '@/ai/flows/settings-flow';
import VideoPopupDialog from '@/components/home/VideoPopupDialog';


export default function CeremonyMemoryPage() {
    const [ceremony, setCeremony] = useState<Ceremony | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
    const [componentButtons, setComponentButtons] = useState<SystemSettings['componentButtons'] | null>(null);
    const [expandedVideo, setExpandedVideo] = useState<Ceremony | null>(null);
    
    const params = useParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const id = params.id as string;
    const { toast } = useToast();

    useEffect(() => {
        const fetchCeremonyData = async () => {
            if (id) {
                setLoading(true);
                try {
                    const data = await getCeremonyById(id);
                    setCeremony(data);
                    if (data) {
                        logUserAction('navigate_to_page', { targetId: data.slug, targetType: 'ceremony_memory' });
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

        fetchCeremonyData();
        fetchSettings();
        
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
             if (currentUser) {
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    setUserProfile(profile);
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                }
            } else {
                setUserProfile(null);
            }
        });
        return () => unsubscribe();

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

    return (
        <EditableProvider>
            <div className="container pt-8 md:pt-12">
                 <div className="max-w-4xl mx-auto">
                    <div className="aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-2xl bg-black">
                        <VideoPlayer
                            ceremonyId={ceremony.id}
                            videoUrl={ceremony.mediaUrl}
                            mediaType={ceremony.mediaType}
                            videoFit="contain"
                            title={ceremony.title}
                            autoplay={true}
                            defaultMuted={false}
                            className="w-full h-full"
                        >
                             <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-20 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={(e) => setExpandedVideo(ceremony)}>
                                <Expand className="h-4 w-4" />
                            </Button>
                        </VideoPlayer>
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
                             <Button asChild={!!user} size="lg" className="w-full" onClick={() => handleAuthAction(() => {})}>
                                <a href={user ? ceremony.downloadUrl : undefined} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    {getButtonText('downloadVideo', 'Descargar Video')}
                                </a>
                            </Button>
                            <Button variant="outline" size="lg" className="w-full" onClick={() => handleAuthAction(() => setIsTestimonialDialogOpen(true))}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {getButtonText('leaveTestimonial', 'Dejar Testimonio')}
                            </Button>
                            <Button variant="ghost" size="lg" className="w-full" onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                {getButtonText('shareCeremony', 'Compartir Ceremonia')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
             {user && ceremony && (
                 <TestimonialDialog
                    user={user}
                    ceremony={ceremony}
                    isOpen={isTestimonialDialogOpen}
                    onClose={() => setIsTestimonialDialogOpen(false)}
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
        </EditableProvider>
    );
}

