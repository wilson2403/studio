
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Save, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllContent, setContent } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_EMAILS = ['wilson2403@gmail.com', 'wilson2403@hotmail.com'];

type ContentItem = {
    id: string;
    value: string | { es: string; en: string };
};

export default function AdminContentPage() {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email || '')) {
                router.push('/');
                return;
            }
            setIsAuthorized(true);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (isAuthorized) {
            const fetchContent = async () => {
                setLoading(true);
                try {
                    const allContent = await getAllContent();
                    setContentItems(allContent.sort((a,b) => a.id.localeCompare(b.id)));
                } catch (error) {
                    toast({ title: t('errorFetchContent'), variant: 'destructive' });
                } finally {
                    setLoading(false);
                }
            };
            fetchContent();
        }
    }, [isAuthorized, toast, t]);

    const handleContentChange = useCallback((id: string, lang: 'es' | 'en' | 'single', value: string) => {
        setContentItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    if (lang === 'single') {
                        return { ...item, value };
                    }
                    const oldValue = typeof item.value === 'object' ? item.value : { es: item.value, en: item.value };
                    return { ...item, value: { ...oldValue, [lang]: value } };
                }
                return item;
            })
        );
    }, []);

    const handleSave = async (id: string) => {
        setIsSaving(true);
        const itemToSave = contentItems.find(item => item.id === id);
        if (!itemToSave) return;
        
        try {
            await setContent(id, itemToSave.value);
            toast({ title: t('contentSavedSuccess') });
        } catch (error) {
             toast({ title: t('errorSavingContent'), variant: 'destructive' });
        } finally {
             setIsSaving(false);
        }
    }

    const filteredContent = useMemo(() => {
        return contentItems.filter(item => {
            const search = searchTerm.toLowerCase();
            if (item.id.toLowerCase().includes(search)) return true;
            if (typeof item.value === 'string') {
                return item.value.toLowerCase().includes(search);
            }
            if (typeof item.value === 'object') {
                return item.value.es.toLowerCase().includes(search) || item.value.en.toLowerCase().includes(search);
            }
            return false;
        });
    }, [contentItems, searchTerm]);

    if (!isAuthorized) {
        return <div className="container py-12"><Skeleton className="h-96 w-full" /></div>
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('contentManagement')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('contentManagementDescription')}</p>
            </div>
            
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t('allContent')}</CardTitle>
                    <CardDescription>{t('allContentDescription')}</CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder={t('searchContentPlaceholder')}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                           {filteredContent.map(item => {
                               const isMultiLanguage = typeof item.value === 'object';
                               return (
                                    <div key={item.id} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                                        <h3 className="font-mono text-sm font-semibold">{item.id}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {isMultiLanguage ? (
                                                <>
                                                    <Textarea
                                                        value={item.value.es}
                                                        onChange={(e) => handleContentChange(item.id, 'es', e.target.value)}
                                                        rows={3}
                                                    />
                                                    <Textarea
                                                        value={item.value.en}
                                                        onChange={(e) => handleContentChange(item.id, 'en', e.target.value)}
                                                        rows={3}
                                                    />
                                                </>
                                            ) : (
                                                <Textarea
                                                    value={item.value as string}
                                                    onChange={(e) => handleContentChange(item.id, 'single', e.target.value)}
                                                    rows={3}
                                                    className="md:col-span-2"
                                                />
                                            )}
                                        </div>
                                        <Button size="sm" onClick={() => handleSave(item.id)} disabled={isSaving}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isSaving ? t('saving') : t('save')}
                                        </Button>
                                    </div>
                               )
                           })}
                        </div>
                    )}
                     {filteredContent.length === 0 && !loading && (
                        <p className='text-center text-muted-foreground py-8'>{t('noContentFound')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
