
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, AlertTriangle, Key, Link2, List, Home, MousePointerClick, Share2, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getSystemSettings, updateSystemSettings } from '@/ai/flows/settings-flow';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SystemSettings } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const navLinkSchema = z.object({
  es: z.string().min(1, 'El nombre en español es requerido.'),
  en: z.string().min(1, 'El nombre en inglés es requerido.'),
  visible: z.boolean(),
});

const homeButtonSchema = z.object({
    es: z.string().min(1, 'El nombre en español es requerido.'),
    en: z.string().min(1, 'El nombre en inglés es requerido.'),
});

const componentButtonSchema = z.object({
    es: z.string().min(1, 'El nombre en español es requerido.'),
    en: z.string().min(1, 'El nombre en inglés es requerido.'),
});

const settingsFormSchema = z.object({
    logoUrl: z.string().url('Debe ser una URL válida.'),
    whatsappCommunityLink: z.string().url('Debe ser una URL válida.'),
    instagramUrl: z.string().url('Debe ser una URL válida.'),
    facebookUrl: z.string().url('Debe ser una URL válida.'),
    tiktokUrl: z.string().url('Debe ser una URL válida.'),
    whatsappNumber: z.string().min(8, 'Debe ser un número de teléfono válido.'),
    navLinks: z.object({
        home: navLinkSchema,
        medicine: navLinkSchema,
        guides: navLinkSchema,
        testimonials: navLinkSchema,
        ceremonies: navLinkSchema,
        journey: navLinkSchema,
        preparation: navLinkSchema,
    }),
    homeButtons: z.object({
        medicine: homeButtonSchema,
        guides: homeButtonSchema,
        preparation: homeButtonSchema,
    }),
    componentButtons: z.object({
        addCeremony: componentButtonSchema,
        buttonViewDetails: componentButtonSchema,
        whatsappCommunityButton: componentButtonSchema,
        downloadVideo: componentButtonSchema,
        leaveTestimonial: componentButtonSchema,
        shareCeremony: componentButtonSchema,
        viewParticipants: componentButtonSchema,
    }),
    ogTitle: homeButtonSchema,
    ogDescription: homeButtonSchema,
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
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold capitalize">{t(`nav${key.charAt(0).toUpperCase() + key.slice(1)}` as any, key)}</h4>
                        <FormField
                            control={form.control}
                            name={`navLinks.${key}.visible`}
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id={`visible-${key}`} />
                                    </FormControl>
                                    <FormLabel htmlFor={`visible-${key}`} className='text-sm'>
                                        {t('visible')}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
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

    const renderHomeButtons = (buttonKeys: (keyof SettingsFormValues['homeButtons'])[]) => (
        <div className="space-y-4">
            {buttonKeys.map((key) => (
                <div key={key} className="p-4 border rounded-lg">
                    <h4 className="font-semibold capitalize mb-4">{t(`homeButton${key.charAt(0).toUpperCase() + key.slice(1)}` as any, key)}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name={`homeButtons.${key}.es`}
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
                            name={`homeButtons.${key}.en`}
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

    const renderComponentButtons = (buttonKeys: (keyof SettingsFormValues['componentButtons'])[]) => (
        <div className="space-y-4">
            {buttonKeys.map((key) => (
                <div key={key} className="p-4 border rounded-lg">
                    <h4 className="font-semibold capitalize mb-4">{t(key as any, key)}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name={`componentButtons.${key}.es`}
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
                            name={`componentButtons.${key}.en`}
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
             <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-primary" />
                        {t('envSettingsTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('envSettingsDescription')}
                    </CardDescription>
                </CardHeader>
            </Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Link2 className="h-5 w-5 text-primary" />
                                {t('contentManagement')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="logoUrl" render={({ field }) => (
                                <FormItem><FormLabel>{t('logoUrl', 'URL del Logo')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="whatsappCommunityLink" render={({ field }) => (
                                <FormItem><FormLabel>{t('whatsappCommunityLink')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                                <FormItem><FormLabel>{t('instagramUrl')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                                <FormItem><FormLabel>{t('facebookUrl')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="tiktokUrl" render={({ field }) => (
                                <FormItem><FormLabel>{t('tiktokUrl')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                                <FormItem><FormLabel>{t('whatsappNumber')}</FormLabel><FormControl><Input {...field} placeholder="50688888888" /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <Accordion type="multiple" className="w-full space-y-4">
                                <AccordionItem value="opengraph">
                                    <AccordionTrigger>
                                        <div className='flex items-center gap-2'>
                                            <Share2 className="h-4 w-4 text-primary" />
                                            {t('ogMetadata')}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-4">
                                        <div className="p-4 border rounded-lg space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="ogTitle.es" render={({ field }) => (
                                                    <FormItem><FormLabel>{t('ogTitle')} (ES)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="ogTitle.en" render={({ field }) => (
                                                    <FormItem><FormLabel>{t('ogTitle')} (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="ogDescription.es" render={({ field }) => (
                                                    <FormItem><FormLabel>{t('ogDescription')} (ES)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="ogDescription.en" render={({ field }) => (
                                                    <FormItem><FormLabel>{t('ogDescription')} (EN)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="navigation"><AccordionTrigger>{t('navigationManagement')}</AccordionTrigger><AccordionContent className="pt-4">{renderNavLinks(['home', 'medicine', 'guides', 'testimonials', 'ceremonies', 'journey', 'preparation'])}</AccordionContent></AccordionItem>
                                <AccordionItem value="homeButtons"><AccordionTrigger>{t('homeButtonsManagement', 'Botones de la Página de Inicio')}</AccordionTrigger><AccordionContent className="pt-4">{renderHomeButtons(['medicine', 'guides', 'preparation'])}</AccordionContent></AccordionItem>
                                <AccordionItem value="componentButtons"><AccordionTrigger>{t('componentButtonsManagement', 'Botones de Componentes')}</AccordionTrigger><AccordionContent className="pt-4">{renderComponentButtons(['addCeremony', 'buttonViewDetails', 'whatsappCommunityButton', 'downloadVideo', 'leaveTestimonial', 'shareCeremony', 'viewParticipants'])}</AccordionContent></AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {form.formState.isSubmitting ? t('saving') : t('saveContentSettings')}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
