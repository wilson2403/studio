

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony, Plan, incrementCeremonyWhatsappClick, getUserProfile, UserProfile } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarIcon, Check, CheckCircle, Clock, Home, MapPin, Share2, X } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';

export default function SingleCeremonyPage() {
    const [ceremony, setCeremony] = useState<Ceremony | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const params = useParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const id = params.id as string;

    
    useEffect(() => {
        const fetchCeremonyData = async () => {
            if (id) {
                setLoading(true);
                try {
                    const data = await getCeremonyById(id);

                    setCeremony(data);
                    if (data?.plans?.length) {
                        const defaultPlan = data.priceType === 'exact' ? data.plans[0] : null;
                        setSelectedPlan(defaultPlan);
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
                    const hasPermission = profile?.role === 'admin' || (profile?.role === 'organizer' && !!profile?.permissions?.canEditCeremonies);
                    setIsAdmin(hasPermission);
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                }
            } else {
                setUserProfile(null);
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();

    }, [id]);
    
    const isAssignedToCeremony = userProfile?.assignedCeremonies?.some(ac => (typeof ac === 'string' ? ac : ac.ceremonyId) === id) || false;

    const assignedPlan = ceremony?.plans?.find(p => 
        userProfile?.assignedCeremonies?.some(ac => 
            typeof ac !== 'string' && ac.ceremonyId === ceremony.id && ac.planId === p.id
        )
    );


    const handleShare = async () => {
        if (!ceremony) return;
        const shareUrl = window.location.href;
        const shareText = t('shareCeremonyText', { title: ceremony.title });
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

        if (ceremony.mediaUrl && ceremony.mediaUrl.includes('githubusercontent')) {
             try {
                await navigator.clipboard.writeText(shareUrl);
                toast({ title: t('linkCopied') });
            } catch (error) {
                toast({ title: t('errorCopyingLink'), variant: 'destructive' });
            }
        } else {
            window.open(whatsappUrl, '_blank');
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Skeleton className="w-full md:w-1/2 h-64 md:h-auto" />
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

    const USD_EXCHANGE_RATE = 500;
    const isEnglish = i18n.language === 'en';
    const hasPlans = ceremony.priceType === 'from' && ceremony.plans && ceremony.plans.length > 0;

    const formatPrice = (price: number, priceUntil?: number) => {
        if (isEnglish) {
          const priceInUSD = Math.round(price / USD_EXCHANGE_RATE);
          if (priceUntil && priceUntil > price) {
            const priceUntilInUSD = Math.round(priceUntil / USD_EXCHANGE_RATE);
            return `$${priceInUSD} - $${priceUntilInUSD} USD`;
          }
          return `$${priceInUSD} USD`;
        }
        if (priceUntil && priceUntil > price) {
            return `${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(price)} - ${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(priceUntil)}`;
        }
        return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(price);
    };

     const getBasePriceText = () => {
        const prefix = ceremony.priceType === 'from' ? (isEnglish ? 'From ' : 'Desde ') : '';
        return `${prefix}${formatPrice(ceremony.price)}`;
    };

    const getWhatsappLink = () => {
        const originalLink = ceremony.link;

        if (!selectedPlan) {
            return originalLink;
        }

        let phone = '';
        const phoneRegex = /(?:wa\.me\/|phone=)(\d+)/;
        const match = originalLink.match(phoneRegex);

        if (match && match[1]) {
            phone = match[1];
        }

        if (!phone) {
            console.warn("Could not extract phone number from WhatsApp link:", originalLink);
            return originalLink; 
        }
        
        const textParam = new URLSearchParams(originalLink.split('?')[1]).get('text');
        const baseText = textParam ? `${textParam} - Plan: ${selectedPlan.name}` : `Hola, me interesa la ceremonia ${ceremony.title} con el plan: ${selectedPlan.name}`;
        
        return `https://wa.me/${phone}?text=${encodeURIComponent(baseText)}`;
    }

    const handleWhatsappClick = () => {
        if (ceremony && !isAdmin) {
            incrementCeremonyWhatsappClick(ceremony.id);
        }
    }

    const isDisabled = hasPlans && !selectedPlan;

    return (
        <EditableProvider>
            <div className="flex flex-col md:flex-row min-h-screen bg-background relative">
                <div className="w-full md:w-1/2 md:h-screen sticky top-0">
                     <VideoPlayer
                        ceremonyId={ceremony.id}
                        videoUrl={ceremony.mediaUrl}
                        mediaType={ceremony.mediaType}
                        videoFit="cover"
                        title={ceremony.title}
                        autoplay
                        defaultMuted={false}
                    >
                        <Button variant="ghost" onClick={handleShare} className="absolute top-2 right-2 z-20 h-10 w-10 p-0 rounded-full bg-black/20 hover:bg-black/40 text-white">
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </VideoPlayer>
                </div>
                <main className="w-full md:w-1/2">
                <ScrollArea className="h-full">
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-between min-h-screen relative">
                        <Button variant="ghost" onClick={() => router.push('/ceremonias')} className="absolute top-4 right-4 z-20 h-10 w-10 p-0 rounded-full bg-card hover:bg-muted text-foreground">
                            <X className="h-5 w-5" />
                        </Button>
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
                                {user && ceremony.status === 'active' && isAssignedToCeremony && ceremony.locationLink && (
                                    <a href={ceremony.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                                        <MapPin className='w-4 h-4'/>
                                        <p>{t('buttonViewLocation', 'Ver Ubicación')}</p>
                                    </a>
                                )}
                            </div>
                            {isAssignedToCeremony && ceremony.status === 'active' && <Badge variant="success" className="mb-4"><CheckCircle className="mr-2 h-4 w-4"/>{t('enrolled')}</Badge>}
                            <p className="text-lg text-foreground/80 mb-8">{ceremony.description}</p>
                            
                            <ul className="space-y-3 pt-4">
                                <li className="flex items-center gap-3 font-bold text-xl">
                                    <span>{t('includes')}</span>
                                </li>
                                {ceremony.features?.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 ml-4">
                                    <Check className="h-5 w-5 text-primary/70" />
                                    <span className="text-muted-foreground text-base">{feature}</span>
                                </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-12">
                            {isAssignedToCeremony && assignedPlan && ceremony.status === 'active' ? (
                                <div className='space-y-4 mb-4'>
                                    <h4 className='font-bold text-center'>{t('yourSelectedPlan')}</h4>
                                    <div className='p-4 border rounded-lg bg-primary/10 border-primary'>
                                        <p className="font-semibold">{assignedPlan.name}</p>
                                        <p className="text-sm text-muted-foreground">{assignedPlan.description}</p>
                                        <p className="font-bold text-lg mt-2">{formatPrice(assignedPlan.price, assignedPlan.priceUntil)}</p>
                                    </div>
                                </div>
                            ) : null}
                            {!isAssignedToCeremony && ceremony.status === 'active' ? (
                                <div className='text-center md:text-left'>
                                    {!hasPlans ? (
                                        <div className="mb-4">
                                            <span className="text-5xl font-bold text-foreground">
                                                {getBasePriceText()}
                                            </span>
                                            <p className="text-sm text-muted-foreground">
                                                {ceremony.contributionText || t('fullPlanUpTo')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className='space-y-4 mb-4'>
                                            <h4 className='font-bold text-center'>{t('selectAPlan')}</h4>
                                            <RadioGroup onValueChange={(value) => setSelectedPlan(JSON.parse(value))} className='space-y-2'>
                                                {ceremony.plans?.map((plan, i) => (
                                                    <Label key={plan.id || i} htmlFor={`plan-${plan.id || i}`} className='flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary'>
                                                        <div>
                                                            <p className="font-semibold">{plan.name}</p>
                                                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                                                        </div>
                                                        <div className='flex items-center gap-4'>
                                                            <span className="font-bold text-lg">{formatPrice(plan.price, plan.priceUntil)}</span>
                                                            <RadioGroupItem value={JSON.stringify(plan)} id={`plan-${plan.id || i}`} />
                                                        </div>
                                                    </Label>
                                                ))}
                                            </RadioGroup>
                                            {ceremony.contributionText && (
                                                <p className="text-sm text-center text-muted-foreground">
                                                    {ceremony.contributionText}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button asChild size="lg" className={cn("w-full", isDisabled && 'opacity-50 pointer-events-none')}>
                                            <a href={isDisabled ? '#' : getWhatsappLink()} target="_blank" rel="noopener noreferrer" onClick={handleWhatsappClick}>
                                                {t('reserveWhatsapp')}
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </ScrollArea>
                </main>
            </div>
        </EditableProvider>
    );
}
