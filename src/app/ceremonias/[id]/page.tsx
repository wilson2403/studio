
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCeremonyById, Ceremony } from '@/lib/firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/home/VideoPlayer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarIcon, Check, Clock, Home } from 'lucide-react';
import CeremonyDetailsDialog from '@/components/home/CeremonyDetailsDialog';
import Link from 'next/link';

export default function SingleCeremonyPage() {
    const [ceremony, setCeremony] = useState<Ceremony | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const params = useParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            const fetchCeremony = async () => {
                setLoading(true);
                const data = await getCeremonyById(id);
                setCeremony(data);
                setLoading(false);
            };
            fetchCeremony();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Skeleton className="w-full md:w-1/2 h-64 md:h-auto" />
                <div className="w-full md:w-1/2 p-8 space-y-6">
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

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <div className="w-full md:w-1/2 md:h-screen sticky top-0">
                <VideoPlayer
                    ceremonyId={ceremony.id}
                    videoUrl={ceremony.mediaUrl}
                    mediaType={ceremony.mediaType}
                    videoFit="cover"
                    title={ceremony.title}
                    autoplay
                    defaultMuted={false}
                />
            </div>
            <main className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between">
                <div>
                     <Button variant="ghost" onClick={() => router.push('/')} className="mb-8">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('backToHome')}
                    </Button>
                    <h1 className="text-4xl lg:text-5xl font-headline mb-4 text-primary">{ceremony.title}</h1>
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
                <div className="mt-12 text-center md:text-left">
                     <div className="mb-4">
                        <span className="text-5xl font-bold text-foreground">
                            {getBasePriceText()}
                        </span>
                        {ceremony.priceType === 'from' && (
                             <p className="text-sm text-muted-foreground mt-1">
                                {t('plansFrom')}
                            </p>
                        )}
                    </div>
                    <Button size="lg" className="w-full md:w-auto" onClick={() => setIsDetailsOpen(true)}>
                        {t('reserveNow')}
                    </Button>
                </div>
            </main>

            {isDetailsOpen && (
                <CeremonyDetailsDialog
                    ceremony={ceremony}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                />
            )}
        </div>
    );
}

// Make sure to set metadata for this page if it's server-rendered in the future.
// export async function generateMetadata({ params }: { params: { id: string } }) { ... }

    