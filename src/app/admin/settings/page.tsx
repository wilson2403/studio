
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, AlertTriangle, Key, Link2, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getSystemSettings, updateSystemSettings } from '@/ai/flows/settings-flow';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SystemSettings } from '@/types';

const navLinkSchema = z.object({
  es: z.string().min(1, 'El nombre en español es requerido.'),
  en: z.string().min(1, 'El nombre en inglés es requerido.'),
});

const settingsFormSchema = z.object({
    firebaseConfig: z.object({
        apiKey: z.string(),
        authDomain: z.string(),
        projectId: z.string(),
        storageBucket: z.string(),
        messagingSenderId: z.string(),
        appId: z.string(),
    }),
    googleApiKey: z.string(),
    resendApiKey: z.string(),
    whatsappCommunityLink: z.string().url('Debe ser una URL válida.'),
    instagramUrl: z.string().url('Debe ser una URL válida.'),
    facebookUrl: z.string().url('Debe ser una URL válida.'),
    tiktokUrl: z.string().url('Debe ser una URL válida.'),
    whatsappNumber: z.string().min(8, 'Debe ser un número de teléfono válido.'),
    navLinks: z.object({
        home: navLinkSchema,
        medicine: navLinkSchema,
        guides: navLinkSchema,
        ceremonies: navLinkSchema,
        preparation: navLinkSchema,
    }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function AdminSettingsPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getSystemSettings();
                form.reset(settings);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                toast({ title: t('errorFetchSettings'), variant: 'destructive' });
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            await fetchSettings();
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t, form]);

    const onSubmit = async (data: SettingsFormValues) => {
        try {
            const result = await updateSystemSettings(data);
            if (result.success) {
                toast({ title: t('settingsUpdatedSuccess'), description: t('settingsUpdatedSuccessDesc') });
            } else {
                toast({ title: t('errorUpdatingSettings'), description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: t('errorUpdatingSettings'), description: error.message, variant: 'destructive' });
        }
    };
    
    if (loading) {
        return (
            <div className="container py-12 md:py-16 space-y-8">
                <Skeleton className="h-12 w-1/3 mx-auto" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    const renderNavLinks = (navLinks: (keyof SettingsFormValues['navLinks'])[]) => (
        <div className="space-y-4">
            {navLinks.map((key) => (
                <div key={key} className="p-4 border rounded-lg">
                    <h4 className="font-semibold capitalize mb-2">{key}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name={`navLinks.${key}.es`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Español</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`navLinks.${key}.en`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>English</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('systemSettings')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('systemSettingsDescription')}</p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Accordion type="multiple" defaultValue={['apis']} className="w-full space-y-4">
                        
                        {/* API Keys Section */}
                        <AccordionItem value="apis" className="border rounded-lg bg-muted/20 px-4">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Key className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">{t('apiKeys')}</h3>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('firebaseConfig')}</CardTitle>
                                         <CardDescription className='flex items-center gap-2 pt-2'><AlertTriangle className='h-4 w-4 text-destructive'/> {t('firebaseConfigWarning')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {Object.keys(form.getValues('firebaseConfig') || {}).map((key) => (
                                            <FormField
                                                key={key}
                                                control={form.control}
                                                name={`firebaseConfig.${key as keyof SettingsFormValues['firebaseConfig']}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Otras APIs</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField control={form.control} name="googleApiKey" render={({ field }) => (
                                            <FormItem><FormLabel>Google API Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="resendApiKey" render={({ field }) => (
                                            <FormItem><FormLabel>Resend API Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </CardContent>
                                </Card>
                            </AccordionContent>
                        </AccordionItem>
                        
                        {/* Content Management Section */}
                        <AccordionItem value="content" className="border rounded-lg bg-muted/20 px-4">
                             <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Link2 className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">{t('contentManagement')}</h3>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <FormField control={form.control} name="whatsappCommunityLink" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('whatsappCommunityLink')}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('instagramUrl')}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('facebookUrl')}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="tiktokUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('tiktokUrl')}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('whatsappNumber')}</FormLabel>
                                        <FormControl><Input {...field} placeholder="50688888888" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Navigation Section */}
                        <AccordionItem value="navigation" className="border rounded-lg bg-muted/20 px-4">
                             <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <List className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">{t('navigationManagement')}</h3>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                                {renderNavLinks(['home', 'medicine', 'guides', 'ceremonies', 'preparation'])}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {form.formState.isSubmitting ? t('saving') : t('saveChanges')}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
