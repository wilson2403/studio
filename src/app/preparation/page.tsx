
'use client';
import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowRight, Check, HeartHandshake, Leaf, Minus, Sparkles, Sprout, Wind, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';
  
  return {
    title: 'Guía de Preparación para tu Ceremonia | El Arte de Sanar',
    description: 'Prepárate para tu ceremonia de Ayahuasca con nuestra guía completa. Aprende sobre la dieta, la preparación mental y emocional, y qué llevar para tu viaje de sanación.',
    openGraph: {
      title: 'Guía de Preparación para tu Ceremonia | El Arte de Sanar',
      description: 'Una guía completa para prepararte física, mental y emocionalmente para tu ceremonia de medicina ancestral.',
      images: [ { url: ogImage } ],
    },
  };
}

export default function PreparationPage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const processSteps = [
        { id: "preparationProcess", titleId: "preparationProcessTitle", descriptionId: "preparationProcessDescription", Icon: Sprout },
        { id: "ceremonyProcess", titleId: "ceremonyProcessTitle", descriptionId: "ceremonyProcessDescription", Icon: Sparkles },
        { id: "experienceProcess", titleId: "experienceProcessTitle", descriptionId: "experienceProcessDescription", Icon: Wind },
        { id: "integrationProcess", titleId: "integrationProcessTitle", descriptionId: "integrationProcessDescription", Icon: HeartHandshake },
    ];
    const mentalPrepSteps = [
        { titleId: "meditationTitle", descriptionId: "meditationDescription" },
        { titleId: "intentionsTitle", descriptionId: "intentionsDescription" },
        { titleId: "reflectionTitle", descriptionId: "reflectionDescription" },
    ];
   
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
          <div className="container py-12 md:py-16 space-y-16">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>{t('authRequiredJourneyTitle')}</CardTitle>
                        <CardDescription>{t('authRequiredJourneyDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                        <Button asChild className="w-full">
                            <Link href="/login?redirect=/preparation">{t('signIn')}</Link>
                        </Button>
                         <Button asChild variant="secondary" className="w-full">
                            <Link href="/register?redirect=/preparation">{t('registerButton')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <EditableProvider>
            <div className="container py-12 md:py-24 space-y-16 md:space-y-24">
                <div className="flex flex-col items-center text-center space-y-4 mb-12 animate-in fade-in-0 duration-1000">
                    <EditableTitle
                        tag="h1"
                        id="preparationPageTitle"
                        initialValue={t('preparationPageTitle')}
                        className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent"
                    />
                    <EditableTitle
                        tag="p"
                        id="preparationGuideFullSubtitle"
                        initialValue={t('preparationGuideFullSubtitle')}
                        className="text-lg text-foreground/80 font-body"
                    />
                </div>
                
                <section>
                    <EditableTitle tag="h2" id="preparationProcessTitle" initialValue={t('preparationProcessTitle')} className="text-3xl font-headline text-primary text-center mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map(({ id, titleId, descriptionId, Icon }) => (
                            <div key={id} className="flex flex-col items-center text-center gap-3 p-4">
                                <div className="p-3 bg-primary/10 rounded-full"><Icon className="h-10 w-10 text-primary" /></div>
                                <EditableTitle tag="h3" id={titleId} initialValue={t(titleId)} className="text-xl font-bold" />
                                <EditableTitle tag="p" id={descriptionId} initialValue={t(descriptionId)} className="text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <EditableTitle tag="h2" id="dietTitle" initialValue={t('dietTitle')} className="text-3xl font-headline text-primary text-center mb-4" />
                    <div className="max-w-3xl mx-auto">
                        <EditableTitle tag="p" id="dietSubtitle" initialValue={t('dietSubtitle')} className="text-muted-foreground text-center mb-8" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="bg-green-950/20 border-green-500/30 p-6">
                            <CardHeader className="p-2">
                                <CardTitle className="flex items-center gap-2 text-green-400">
                                    <Leaf/>
                                    <EditableTitle tag="p" id="allowedFoodsTitle" initialValue={t('allowedFoodsTitle')} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                                 <EditableTitle tag="p" id="allowedFoodsList" initialValue={t('allowedFoodsList')} className="space-y-2" />
                            </CardContent>
                        </Card>
                        <Card className="bg-red-950/20 border-red-500/30 p-6">
                            <CardHeader className="p-2">
                                <CardTitle className="flex items-center gap-2 text-red-400">
                                    <Minus/>
                                    <EditableTitle tag="p" id="prohibitedFoodsTitle" initialValue={t('prohibitedFoodsTitle')} />
                                </CardTitle>
                            </CardHeader>
                             <CardContent className="p-2">
                                <EditableTitle tag="p" id="prohibitedFoodsList" initialValue={t('prohibitedFoodsList')} className="space-y-2" />
                            </CardContent>
                        </Card>
                    </div>
                </section>
                
                <section>
                    <EditableTitle tag="h2" id="mentalPrepTitle" initialValue={t('mentalPrepTitle')} className="text-3xl font-headline text-primary text-center mb-4" />
                    <div className="max-w-3xl mx-auto">
                        <EditableTitle tag="p" id="mentalPrepSubtitle" initialValue={t('mentalPrepSubtitle')} className="text-muted-foreground text-center mb-8" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {mentalPrepSteps.map(item => (
                            <Card key={item.titleId} className="p-6 text-center">
                                <EditableTitle tag="h3" id={item.titleId} initialValue={t(item.titleId)} className="font-bold text-xl mb-2" />
                                <EditableTitle tag="p" id={item.descriptionId} initialValue={t(item.descriptionId)} className="text-muted-foreground" />
                            </Card>
                        ))}
                    </div>
                </section>
                
                <section className="text-center max-w-3xl mx-auto">
                    <EditableTitle tag="h2" id="emotionalHealingTitle" initialValue={t('emotionalHealingTitle')} className="text-3xl font-headline text-primary mb-4" />
                    <EditableTitle tag="p" id="emotionalHealingDescription" initialValue={t('emotionalHealingDescription')} className="text-muted-foreground text-lg" />
                </section>

                <section>
                     <EditableTitle tag="h2" id="whatToBringTitle" initialValue={t('whatToBringTitle')} className="text-3xl font-headline text-primary text-center mb-8" />
                     <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        <div>
                            <EditableTitle tag="h3" id="comfortItemsTitle" initialValue={t('comfortItemsTitle')} className="font-bold text-xl mb-4 text-center" />
                            <EditableTitle tag="p" id="comfortItemsList" initialValue={t('comfortItemsList')} className="space-y-2 text-left" />
                        </div>
                        <div>
                            <EditableTitle tag="h3" id="essentialsTitle" initialValue={t('essentialsTitle')} className="font-bold text-xl mb-4 text-center" />
                             <EditableTitle tag="p" id="essentialsList" initialValue={t('essentialsList')} className="space-y-2" />
                        </div>
                    </div>
                </section>
            </div>
        </EditableProvider>
    )
}

    