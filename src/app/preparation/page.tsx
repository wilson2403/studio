
'use client';
import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PreparationPage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
                        id="preparationPageSubtitle"
                        initialValue="Esta es una vista previa del contenido. Para una experiencia guiada, completa tu cuestionario."
                        className="text-lg text-foreground/80 font-body"
                    />
                    <Button asChild>
                        <Link href="/questionnaire">
                            Ir a mi Guía de Preparación <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </EditableProvider>
    )
}
