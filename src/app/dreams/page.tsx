
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { DreamEntry, getDreamEntries } from '@/lib/firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { NotebookText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MyDreamsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const [dreamEntries, setDreamEntries] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/dreams');
      return;
    }

    const fetchDreams = async () => {
      setLoading(true);
      const entries = await getDreamEntries(user.uid);
      setDreamEntries(entries);
      setLoading(false);
    };

    fetchDreams();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="container py-12 md:py-16 space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          {t('myDreamsTitle')}
        </h1>
        <p className="mt-2 text-lg text-foreground/80 font-body">{t('myDreamsDescription')}</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-2">
        {dreamEntries.length > 0 ? (
           <Accordion type="single" collapsible className="w-full">
            {dreamEntries.map((entry, index) => (
               <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg bg-card/50 backdrop-blur-sm px-4 mb-4">
                 <AccordionTrigger className="hover:no-underline text-xl font-bold">
                    {format(entry.date, 'PPP', { locale })}
                 </AccordionTrigger>
                 <AccordionContent className="space-y-4 pt-4 border-t">
                    <div>
                      <h3 className="font-semibold text-primary">{t('yourDream')}</h3>
                      <p className="text-muted-foreground italic mt-1">"{entry.dream}"</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{t('interpretation')}</h3>
                      <p className="whitespace-pre-wrap mt-1">{entry.interpretation}</p>
                    </div>
                    {entry.recommendations?.personal && (
                      <div>
                        <h3 className="font-semibold text-primary">{t('recommendations')}</h3>
                        <p className="whitespace-pre-wrap mt-1">{entry.recommendations.personal}</p>
                      </div>
                    )}
                    {entry.recommendations?.lucidDreaming && entry.recommendations.lucidDreaming.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-primary">{t('lucidDreamingTips')}</h3>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            {entry.recommendations.lucidDreaming.map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                 </AccordionContent>
               </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16 border border-dashed rounded-lg">
            <NotebookText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('noDreamsFound')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('myDreamsSubtitle')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
