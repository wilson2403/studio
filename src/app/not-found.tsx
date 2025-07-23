
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
    const { t } = useTranslation();

    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                  <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                    <Frown className="h-12 w-12 text-destructive" />
                  </div>
                  <CardTitle className="mt-4 text-3xl font-headline">{t('notFoundTitle')}</CardTitle>
                  <CardDescription>{t('notFoundDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/">{t('goHome')}</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
