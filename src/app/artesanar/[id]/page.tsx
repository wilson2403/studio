
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony, logUserAction, addTestimonial, Testimonial } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckCircle, Clock, Download, Home, MessageSquare, Share2 } from 'lucide-react';
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
        return <Skeleton className="w-screen h-screen" />;
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
            <div className="h-screen w-screen relative">
                <div className="absolute inset-0 z-0">
                     <VideoPlayer
                        ceremonyId={ceremony.id}
                        videoUrl={ceremony.mediaUrl}
                        mediaType={ceremony.mediaType}
                        videoFit="cover"
                        title={ceremony.title}
                        autoplay
                        defaultMuted={true}
                    />
                </div>
                <div className="absolute inset-0 z-10 bg-black/50"></div>
                <main className="relative z-20 flex flex-col items-center justify-between text-center text-white h-full p-4">
                    <div className='flex-grow flex flex-col items-center justify-start pt-20'>
                        <h1 className="text-4xl lg:text-6xl font-headline mb-4 drop-shadow-lg animate-in fade-in-0 slide-in-from-bottom-5 duration-1000">{ceremony.title}</h1>
                        <div className="font-mono text-sm text-white/80 mb-6 space-y-1 drop-shadow-md animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-200">
                            {ceremony.date && (
                            <p className="flex items-center gap-2 justify-center">
                                <CalendarIcon className='w-4 h-4'/> {ceremony.date}
                            </p>
                            )}
                            {ceremony.horario && (
                            <p className="flex items-center gap-2 justify-center">
                                <Clock className='w-4 h-4'/> {ceremony.horario}
                            </p>
                            )}
                        </div>
                        {isAssignedToCeremony && <Badge variant="success" className="mb-4 animate-in fade-in-0 duration-1000 delay-300"><CheckCircle className="mr-2 h-4 w-4"/>{t('enrolled')}</Badge>}
                        <p className="text-lg text-white/90 mb-8 max-w-2xl drop-shadow animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-400">{ceremony.description}</p>
                    </div>

                    <div className="w-full max-w-md space-y-3 pb-8 animate-in fade-in-0 slide-in-from-bottom-10 duration-1000 delay-500">
                        {isAssignedToCeremony && ceremony.downloadUrl && (
                            <Button asChild size="lg" className="w-full">
                                <a href={ceremony.downloadUrl} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    {t('downloadVideo')}
                                </a>
                            </Button>
                        )}
                        {isAssignedToCeremony && (
                            <Button variant="outline" size="lg" className="w-full bg-white/10 border-white/20 hover:bg-white/20" onClick={() => setIsTestimonialDialogOpen(true)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {t('testimonialTitle')}
                            </Button>
                        )}
                         <Button variant="ghost" size="lg" className="w-full text-white/80 hover:text-white hover:bg-white/10" onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            {t('shareCeremony')}
                        </Button>
                    </div>
                </main>
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
