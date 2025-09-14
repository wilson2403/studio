
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Save, Search, PlusCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllContent, setContent, Content } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ADMIN_EMAILS = ['wilson2403@gmail.com', 'wilson2403@hotmail.com'];

type GroupedContent = {
    [group: string]: Content[];
}

const newContentSchema = (t: (key: string) => string) => z.object({
  id: z.string().min(1, t('errorRequired')).regex(/^[a-zA-Z0-9_]+$/, t('errorInvalidId')),
  type: z.enum(['text', 'image_url', 'video_url', 'link_url']),
  es: z.string().min(1, t('errorRequired')),
  en: z.string().min(1, t('errorRequired')),
});

type NewContentFormValues = z.infer<ReturnType<typeof newContentSchema>>;


export default function AdminContentPage() {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [contentItems, setContentItems] = useState<Content[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const { toast } = useToast();

    const newContentForm = useForm<NewContentFormValues>({
        resolver: zodResolver(newContentSchema(t)),
        defaultValues: { id: '', type: 'text', es: '', en: '' }
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || !currentUser.email || !ADMIN_EMAILS.includes(currentUser.email)) {
                router.push('/');
                return;
            }
            setIsAuthorized(true);
        });
        return () => unsubscribe();
    }, [router]);
    
    useEffect(() => {
        const initialSearch = searchParams.get('search');
        if (initialSearch) {
            setSearchTerm(initialSearch);
        }
    }, [searchParams]);

    const fetchAllContent = useCallback(async () => {
        if (isAuthorized) {
            setLoading(true);
            try {
                const allContent = await getAllContent();
                setContentItems(allContent.sort((a,b) => a.id.localeCompare(b.id)));
            } catch (error) {
                toast({ title: t('errorFetchContent'), variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        }
    }, [isAuthorized, toast, t]);

    useEffect(() => {
        fetchAllContent();
    }, [fetchAllContent]);

    const handleContentChange = useCallback((id: string, lang: 'es' | 'en' | 'single', value: string) => {
        setContentItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    if (lang === 'single') {
                        return { ...item, value };
                    }
                    const oldValue = typeof item.value === 'object' ? item.value : { es: item.value as string, en: item.value as string };
                    return { ...item, value: { ...oldValue, [lang]: value } };
                }
                return item;
            })
        );
    }, []);

    const handleSaveGroup = async (groupItems: Content[]) => {
        setIsSaving(true);
        try {
            await Promise.all(
                groupItems.map(item => setContent(item.id, item.value))
            );
            toast({ title: t('contentSavedSuccess') });
        } catch (error) {
             toast({ title: t('errorSavingContent'), variant: 'destructive' });
        } finally {
             setIsSaving(false);
        }
    }

    const onNewContentSubmit = async (data: NewContentFormValues) => {
        setIsSaving(true);
        try {
            const newContentItem: Content = {
                id: data.id,
                value: { es: data.es, en: data.en },
                type: data.type
            };
            await setContent(data.id, newContentItem.value, newContentItem.type);
            toast({ title: t('contentAddedSuccess') });
            setIsAdding(false);
            newContentForm.reset();
            await fetchAllContent();
        } catch (error) {
            toast({ title: t('errorAddingContent'), variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }


    const filteredAndGroupedContent: GroupedContent = useMemo(() => {
        const filtered = contentItems.filter(item => {
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

        return filtered.reduce((acc, item) => {
            const groupName = item.id.split(/[A-Z_.]/)[0] || 'general';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(item);
            return acc;
        }, {} as GroupedContent);

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
                    <div className='flex justify-between items-center'>
                        <CardTitle>{t('allContent')}</CardTitle>
                        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
                            {isAdding ? <X className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            {isAdding ? t('cancel') : t('addNewContent')}
                        </Button>
                    </div>
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
                    {isAdding && (
                        <Card className='mb-8 p-6 bg-muted/30'>
                             <h3 className="text-lg font-semibold mb-4">{t('addNewContent')}</h3>
                             <Form {...newContentForm}>
                                <form onSubmit={newContentForm.handleSubmit(onNewContentSubmit)} className="space-y-4">
                                     <FormField
                                        control={newContentForm.control}
                                        name="id"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formVariableId')}</FormLabel>
                                            <FormControl><Input {...field} placeholder="ejemploContenido" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={newContentForm.control}
                                        name="type"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formContentType')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder={t('formSelectType')} /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="text">{t('contentTypeText')}</SelectItem>
                                                    <SelectItem value="image_url">{t('contentTypeImageUrl')}</SelectItem>
                                                    <SelectItem value="video_url">{t('contentTypeVideoUrl')}</SelectItem>
                                                    <SelectItem value="link_url">{t('contentTypeLinkUrl')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={newContentForm.control}
                                        name="es"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formSpanishText')}</FormLabel>
                                            <FormControl><Textarea {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={newContentForm.control}
                                        name="en"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formEnglishText')}</FormLabel>
                                            <FormControl><Textarea {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSaving}>
                                        <Save className='mr-2 h-4 w-4' />
                                        {isSaving ? t('saving') : t('saveContent')}
                                    </Button>
                                </form>
                            </Form>
                        </Card>
                    )}
                    {loading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-4">
                           {Object.entries(filteredAndGroupedContent).map(([groupName, items]) => (
                                <AccordionItem key={groupName} value={groupName} className="border rounded-lg bg-muted/20 px-4">
                                    <AccordionTrigger>
                                        <div className='flex items-center gap-4'>
                                            <p className="font-semibold capitalize">{groupName.replace(/([A-Z])/g, ' $1')}</p>
                                            <span className='text-xs text-muted-foreground'>({items.length} {t('fields')})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 border-t space-y-6">
                                        {items.map(item => {
                                            const isMultiLanguage = typeof item.value === 'object';
                                            const itemType = item.type || (typeof item.value === 'string' && item.value.startsWith('http') ? 'url' : 'text');

                                            return (
                                                <div key={item.id} className="p-4 border rounded-lg bg-background/50 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="font-mono text-sm font-semibold text-muted-foreground">{item.id}</h3>
                                                        <span className='text-xs font-mono bg-muted px-2 py-1 rounded'>{t(`contentType_${itemType}`)}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {isMultiLanguage ? (
                                                            <>
                                                                <div>
                                                                    <label className='text-xs font-bold'>ES</label>
                                                                    <Textarea
                                                                        value={item.value.es}
                                                                        onChange={(e) => handleContentChange(item.id, 'es', e.target.value)}
                                                                        rows={3}
                                                                    />
                                                                </div>
                                                                 <div>
                                                                    <label className='text-xs font-bold'>EN</label>
                                                                    <Textarea
                                                                        value={item.value.en}
                                                                        onChange={(e) => handleContentChange(item.id, 'en', e.target.value)}
                                                                        rows={3}
                                                                    />
                                                                </div>
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
                                                </div>
                                            )
                                        })}
                                         <Button size="sm" onClick={() => handleSaveGroup(items)} disabled={isSaving}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isSaving ? t('saving') : t('saveGroup', { group: groupName })}
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                           ))}
                        </Accordion>
                    )}
                     {Object.keys(filteredAndGroupedContent).length === 0 && !loading && (
                        <p className='text-center text-muted-foreground py-8'>{t('noContentFound')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

    