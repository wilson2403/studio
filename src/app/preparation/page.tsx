
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

export default function PreparationPage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const processSteps = [
        { id: "preparation", title: "preparationProcessTitle", description: "preparationProcessDescription", Icon: Sprout },
        { id: "ceremony", title: "ceremonyProcessTitle", description: "ceremonyProcessDescription", Icon: Sparkles },
        { id: "experience", title: "experienceProcessTitle", description: "experienceProcessDescription", Icon: Wind },
        { id: "integration", title: "integrationProcessTitle", description: "integrationProcessDescription", Icon: HeartHandshake },
    ];
    const mentalPrepSteps = [
        { title: "meditationTitle", description: "meditationDescription" },
        { title: "intentionsTitle", description: "intentionsDescription" },
        { title: "reflectionTitle", description: "reflectionDescription" },
    ];
    const comfortItems = Array.isArray(t('comfortItemsList', { returnObjects: true })) ? t('comfortItemsList', { returnObjects: true }) as string[] : [];
    const essentialItems = Array.isArray(t('essentialsList', { returnObjects: true })) ? t('essentialsList', { returnObjects: true }) as string[] : [];
    const allowedFoods = Array.isArray(t('allowedFoodsList', { returnObjects: true })) ? t('allowedFoodsList', { returnObjects: true }) as string[] : [];
    const prohibitedFoods = Array.isArray(t('prohibitedFoodsList', { returnObjects: true })) ? t('prohibitedFoodsList', { returnObjects: true }) as string[] : [];

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
                        <CardTitle>{t('accessDenied')}</CardTitle>
                        <CardDescription>{t('mustBeLoggedInToView')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/login?redirect=/preparation">{t('signIn')}</Link>
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
                        initialValue="Aquí puedes consultar toda la información de tu guía de preparación en cualquier momento."
                        className="text-lg text-foreground/80 font-body"
                    />
                </div>
                
                <section>
                    <h2 className="text-3xl font-headline text-primary text-center mb-8">{t('preparationProcessTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map(({ id, title, description, Icon }) => (
                            <div key={id} className="flex flex-col items-center text-center gap-3 p-4">
                                <div className="p-3 bg-primary/10 rounded-full"><Icon className="h-10 w-10 text-primary" /></div>
                                <h3 className="text-xl font-bold">{t(title)}</h3>
                                <p className="text-muted-foreground">{t(description)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-headline text-primary text-center mb-4">{t('dietTitle')}</h2>
                    <p className="text-muted-foreground text-center mb-8">{t('dietSubtitle')}</p>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="bg-green-950/20 border-green-500/30 p-6"><CardHeader className="p-2"><CardTitle className="flex items-center gap-2 text-green-400"><Leaf/>{t('allowedFoodsTitle')}</CardTitle></CardHeader><CardContent className="p-2"><ul className="space-y-2">{allowedFoods.map((item, i) => <li key={i} className="flex gap-2"><Check className="h-5 w-5 text-green-400 mt-0.5 shrink-0"/>{item}</li>)}</ul></CardContent></Card>
                        <Card className="bg-red-950/20 border-red-500/30 p-6"><CardHeader className="p-2"><CardTitle className="flex items-center gap-2 text-red-400"><Minus/>{t('prohibitedFoodsTitle')}</CardTitle></CardHeader><CardContent className="p-2"><ul className="space-y-2">{prohibitedFoods.map((item, i) => <li key={i} className="flex gap-2"><Minus className="h-5 w-5 text-red-400 mt-0.5 shrink-0"/>{item}</li>)}</ul></CardContent></Card>
                    </div>
                </section>
                
                <section>
                    <h2 className="text-3xl font-headline text-primary text-center mb-4">{t('mentalPrepTitle')}</h2>
                    <p className="text-muted-foreground text-center mb-8">{t('mentalPrepSubtitle')}</p>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {mentalPrepSteps.map(item => (<Card key={item.title} className="p-6 text-center"><CardTitle className="font-bold text-xl mb-2">{t(item.title)}</CardTitle><p className="text-muted-foreground">{t(item.description)}</p></Card>))}
                    </div>
                </section>
                
                <section className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-headline text-primary mb-4">{t('emotionalHealingTitle')}</h2>
                    <p className="text-muted-foreground text-lg">{t('emotionalHealingDescription')}</p>
                </section>

                <section>
                     <h2 className="text-3xl font-headline text-primary text-center mb-8">{t('whatToBringTitle')}</h2>
                     <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        <div><h3 className="font-bold text-xl mb-4 text-center">{t('comfortItemsTitle')}</h3><ul className="space-y-2">{comfortItems.map((item, i) => <li key={i} className="flex gap-3 items-center"><CheckCircle className="h-5 w-5 text-primary shrink-0"/>{item}</li>)}</ul></div>
                        <div><h3 className="font-bold text-xl mb-4 text-center">{t('essentialsTitle')}</h3><ul className="space-y-2">{essentialItems.map((item, i) => <li key={i} className="flex gap-3 items-center"><CheckCircle className="h-5 w-5 text-primary shrink-0"/>{item}</li>)}</ul></div>
                    </div>
                </section>
            </div>
        </EditableProvider>
    )
}
