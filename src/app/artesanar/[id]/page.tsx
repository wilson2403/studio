
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony, logUserAction } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckCircle, Clock, Download, Home, MapPin, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { EditableProvider } from '@/components/home/EditableProvider';
import TestimonialDialog from '@/components/admin/TestimonialDialog';
import { getUserProfile, UserProfile } from '@/lib/firebase/firestore';


export default function CeremonyMemoryPage() {
    const [ceremony, setCeremony] = useState<Ceremony | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
    
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const id = params.id as string;

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

        fetchCeremonyData();
        
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

    const isAssignedToCeremony = userProfile?.assignedCeremonies?.some(ac => (typeof ac === 'string' ? ac : ac.ceremonyId) === id) || false;

    const handleShare = async () => {
        if (!ceremony) return;
        const shareUrl = window.location.href;
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
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
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
            <div className="container py-8 md:py-12">
                 <div className="max-w-4xl mx-auto">
                    <div className="aspect-video w-full mb-8 rounded-lg overflow-hidden shadow-2xl bg-black">
                        <VideoPlayer
                            ceremonyId={ceremony.id}
                            videoUrl={ceremony.mediaUrl}
                            mediaType={ceremony.mediaType}
                            videoFit="contain"
                            title={ceremony.title}
                            autoplay={false}
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
                        {isAssignedToCeremony && <Badge variant="success" className="mb-4"><CheckCircle className="mr-2 h-4 w-4"/>{t('enrolled')}</Badge>}
                        <p className="text-lg text-foreground/80 mb-8">{ceremony.description?.replace(/Duración: \d+ horas/i, '').trim()}</p>
                    
                        <div className="w-full max-w-xs mx-auto space-y-3">
                            {isAssignedToCeremony && ceremony.downloadUrl && (
                                <Button asChild size="lg" className="w-full">
                                    <a href={ceremony.downloadUrl} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        {t('downloadVideo')}
                                    </a>
                                </Button>
                            )}
                            {isAssignedToCeremony && (
                                <Button variant="outline" size="lg" className="w-full" onClick={() => setIsTestimonialDialogOpen(true)}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {t('testimonialTitle')}
                                </Button>
                            )}
                            <Button variant="ghost" size="lg" className="w-full" onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                {t('shareCeremony')}
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
        </EditableProvider>
    );
}
