
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony, Plan, incrementCeremonyWhatsappClick, getUserProfile, UserProfile, logUserAction, addTestimonial, Testimonial } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckCircle, Clock, Download, Home, Share2 } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Ceremonies from '@/components/home/Ceremonies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EditableProvider } from '@/components/home/EditableProvider';

export default function CeremonyMemoryPage() {
    const [ceremony, setCeremony] = useState<Ceremony | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [testimonialText, setTestimonialText] = useState('');
    const [consent, setConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const id = params.id as string;

    useEffect(() => {
        const fetchCeremonyData = async () => {
            if (id) {
                setLoading(true);
                try {
                    const data = await getCeremonyById(id);
                    setCeremony(data);
                    if (data) {
                        logUserAction('navigate_to_page', { targetId: data.id, targetType: 'ceremony_memory' });
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
                // Fallback to WhatsApp if share API fails or is denied
                window.open(whatsappUrl, '_blank');
            }
        } else {
            window.open(whatsappUrl, '_blank');
        }
    };
    
    const handleTestimonialSubmit = async () => {
        if (!user || !ceremony || !testimonialText.trim() || !consent) {
            toast({
                title: t('error'),
                description: t('testimonialErrorDescription'),
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const testimonialData: Omit<Testimonial, 'id'> = {
                userId: user.uid,
                ceremonyId: ceremony.id,
                type: 'text',
                content: testimonialText,
                consent: consent,
                createdAt: new Date(),
                userName: user.displayName || 'Anónimo',
                userPhotoUrl: user.photoURL
            };
            await addTestimonial(testimonialData);
            toast({
                title: t('testimonialSuccessTitle'),
                description: t('testimonialSuccessDescription'),
            });
            setTestimonialText('');
            setConsent(false);
        } catch (error) {
            toast({
                title: t('error'),
                description: t('testimonialErrorSubmit'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Skeleton className="w-full md:w-1/2 h-64 md:h-screen" />
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-full" />
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
        <div>
            <div className="flex flex-col md:flex-row min-h-screen bg-background relative">
                <div className="w-full md:w-1/2 md:h-screen sticky top-0">
                     <VideoPlayer
                        ceremonyId={ceremony.id}
                        videoUrl={ceremony.mediaUrl}
                        mediaType={ceremony.mediaType}
                        videoFit="cover"
                        title={ceremony.title}
                        autoplay
                        defaultMuted={true}
                    >
                        <Button variant="ghost" onClick={handleShare} className="absolute top-4 right-4 z-20 h-10 w-10 p-0 rounded-full bg-black/20 hover:bg-black/40 text-white">
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </VideoPlayer>
                </div>
                <main className="w-full md:w-1/2">
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-between min-h-screen">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-headline mb-4 text-primary mt-12">{ceremony.title}</h1>
                            <div className="font-mono text-sm text-muted-foreground mb-6 space-y-1">
                                {ceremony.date && (
                                <p className="flex items-center gap-2">
                                    <CalendarIcon className='w-4 h-4'/> {ceremony.date}
                                </p>
                                )}
                                {ceremony.horario && (
                                <p className="flex items-center gap-2">
                                    <Clock className='w-4 h-4'/> {ceremony.horario}
                                </p>
                                )}
                            </div>
                            {isAssignedToCeremony && <Badge variant="success" className="mb-4"><CheckCircle className="mr-2 h-4 w-4"/>{t('enrolled')}</Badge>}
                            <p className="text-lg text-foreground/80 mb-8">{ceremony.description}</p>
                        </div>
                        <div className="mt-12">
                             {isAssignedToCeremony && ceremony.downloadUrl && (
                                <Button asChild size="lg" className="w-full">
                                    <a href={ceremony.downloadUrl} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        {t('downloadVideo')}
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            
            {isAssignedToCeremony && (
                <section className="py-12 md:py-24 bg-muted">
                    <div className="container">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle>{t('testimonialTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <p className="text-muted-foreground">{t('testimonialDescription')}</p>
                               <Textarea
                                   value={testimonialText}
                                   onChange={(e) => setTestimonialText(e.target.value)}
                                   placeholder={t('testimonialPlaceholder')}
                                   rows={5}
                               />
                               <div className="flex items-center space-x-2">
                                   <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} />
                                   <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">{t('testimonialConsent')}</Label>
                               </div>
                               <Button onClick={handleTestimonialSubmit} disabled={isSubmitting || !consent || !testimonialText.trim()}>
                                    {isSubmitting ? t('sending') : t('submitTestimonial')}
                               </Button>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            <Ceremonies
                status="finished"
                id="eventos-anteriores"
                titleId="pastEventsTitle"
                titleInitialValue={t('pastEventsTitle')}
                hideDownloadButton={false}
            />
        </div>
        </EditableProvider>
    );
}
