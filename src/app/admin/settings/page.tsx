
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, AlertTriangle, Key, Link2, List, Home, MousePointerClick, Share2, Server, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getSystemSettings, updateSystemSettings, getSystemEnvironment, updateSystemEnvironment } from '@/ai/flows/settings-flow';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SystemSettings, EnvironmentSettings, FirebaseConfig } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditable } from '@/components/home/EditableProvider';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

const navLinkSchema = (t: (key: string) => string) => z.object({
  es: z.string().min(1, t('errorRequired')),
  en: z.string().min(1, t('errorRequired')),
  visible: z.boolean(),
});

const homeButtonSchema = (t: (key: string) => string) => z.object({
    es: z.string().min(1, t('errorRequired')),
    en: z.string().min(1, t('errorRequired')),
});

const componentButtonSchema = (t: (key: string) => string) => z.object({
    es: z.string().min(1, t('errorRequired')),
    en: z.string().min(1, t('errorRequired')),
});

const settingsFormSchema = (t: (key: string) => string) => z.object({
    logoUrl: z.string().url(t('errorInvalidUrl')),
    whatsappCommunityLink: z.string().url(t('errorInvalidUrl')),
    instagramUrl: z.string().url(t('errorInvalidUrl')),
    facebookUrl: z.string().url(t('errorInvalidUrl')),
    tiktokUrl: z.string().url(t('errorInvalidUrl')),
    whatsappNumber: z.string().min(8, t('errorInvalidPhone')),
    navLinks: z.object({
        home: navLinkSchema(t),
        medicine: navLinkSchema(t),
        guides: navLinkSchema(t),
        testimonials: navLinkSchema(t),
        ceremonies: navLinkSchema(t),
        journey: navLinkSchema(t),
        preparation: navLinkSchema(t),
    }),
    homeButtons: z.object({
        medicine: homeButtonSchema(t),
        guides: homeButtonSchema(t),
        preparation: homeButtonSchema(t),
    }),
    componentButtons: z.object({
        addCeremony: componentButtonSchema(t),
        buttonViewDetails: componentButtonSchema(t),
        whatsappCommunityButton: componentButtonSchema(t),
        downloadVideo: componentButtonSchema(t),
        leaveTestimonial: componentButtonSchema(t),
        shareCeremony: componentButtonSchema(t),
        viewParticipants: componentButtonSchema(t),
    }),
    ogTitle: homeButtonSchema(t),
    ogDescription: homeButtonSchema(t),
});

const firebaseConfigSchema = (t: (key: string) => string) => z.object({
    apiKey: z.string().min(1, t('errorRequired')),
    authDomain: z.string().min(1, t('errorRequired')),
    projectId: z.string().min(1, t('errorRequired')),
    storageBucket: z.string().min(1, t('errorRequired')),
    messagingSenderId: z.string().min(1, t('errorRequired')),
    appId: z.string().min(1, t('errorRequired')),
});

const environmentSchema = (t: (key: string) => string) => z.object({
    environments: z.object({
        production: z.object({
            firebaseConfig: firebaseConfigSchema(t),
            geminiApiKey: z.string().optional(),
            resendApiKey: z.string().optional(),
        }),
        backup: z.object({
            firebaseConfig: firebaseConfigSchema(t),
            geminiApiKey: z.string().optional(),
            resendApiKey: z.string().optional(),
        }),
    }),
});

type SettingsFormValues = z.infer<ReturnType<typeof settingsFormSchema>>;
type EnvironmentFormValues = z.infer<ReturnType<typeof environmentSchema>>;


export default function AdminSettingsPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { content: editableContent, fetchContent } = useEditable();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema(t)),
    });

    const envForm = useForm<EnvironmentFormValues>({
        resolver: zodResolver(environmentSchema(t)),
    });
    
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [settings, envSettings] = await Promise.all([
                    getSystemSettings(),
                    getSystemEnvironment()
                ]);
                form.reset(settings);
                envForm.reset({ environments: envSettings.environments });
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                toast({ title: t('errorFetchSettings'), variant: 'destructive' });
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            await fetchSettings();
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t, form, envForm]);

    const onSettingsSubmit = async (data: SettingsFormValues) => {
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
    
    const onEnvSubmit = async (data: EnvironmentFormValues) => {
        try {
            // We only update the environments part, not the active one
            const result = await updateSystemEnvironment({ activeEnvironment: 'production', ...data });
            if (result.success) {
                toast({ title: t('envSettingsUpdatedSuccess'), description: t('envSettingsUpdatedSuccessDesc') });
            } else {
                toast({ title: t('errorUpdatingEnvSettings'), description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: t('errorUpdatingEnvSettings'), description: error.message, variant: 'destructive' });
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
                                    <FormLabel>{t('spanish')}</FormLabel>
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
                                    <FormLabel>{t('english')}</FormLabel>
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
                                    <FormLabel>{t('spanish')}</FormLabel>
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
                                    <FormLabel>{t('english')}</FormLabel>
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
                                    <FormLabel>{t('spanish')}</FormLabel>
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
                                    <FormLabel>{t('english')}</FormLabel>
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

    const renderFirebaseConfigFields = (env: 'production' | 'backup') => {
        const fields: { name: keyof FirebaseConfig, label: string }[] = [
            { name: 'apiKey', label: t('firebaseApiKey') },
            { name: 'appId', label: t('firebaseAppId') },
            { name: 'authDomain', label: t('firebaseAuthDomain') },
            { name: 'messagingSenderId', label: t('firebaseMessagingSenderId') },
            { name: 'projectId', label: t('firebaseProjectId') },
            { name: 'storageBucket', label: t('firebaseStorageBucket') },
        ];
        
        fields.sort((a, b) => a.label.localeCompare(b.label));

        return fields.map(field => (
            <FormField
                key={`${env}-${field.name}`}
                control={envForm.control}
                name={`environments.${env}.firebaseConfig.${field.name}`}
                render={({ field: formField }) => (
                    <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl><Input {...formField} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        ));
    };

    const copyEnvFile = (env: 'production' | 'backup') => {
        const values = envForm.getValues(`environments.${env}`);
        const envContent = `NEXT_PUBLIC_FIREBASE_API_KEY=${values.firebaseConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${values.firebaseConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${values.firebaseConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${values.firebaseConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${values.firebaseConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${values.firebaseConfig.appId}
GEMINI_API_KEY=${values.geminiApiKey || ''}
RESEND_API_KEY=${values.resendApiKey || ''}`;

        navigator.clipboard.writeText(envContent).then(() => {
            toast({ title: t('envCopied'), description: t('envCopiedDesc', {env: t(env)}) });
        }).catch(err => {
            toast({ title: t('errorCopying'), variant: 'destructive'});
            console.error("Failed to copy env file", err);
        });
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('systemSettings')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('systemSettingsDescription')}</p>
            </div>
             
             <Form {...envForm}>
                <form onSubmit={envForm.handleSubmit(onEnvSubmit)} className="space-y-8">
                    <Accordion type="single" collapsible defaultValue="api-keys">
                      <AccordionItem value="api-keys">
                         <AccordionTrigger>
                             <div className="flex items-center gap-3">
                                <Key className="h-5 w-5 text-primary" />
                                {t('envSettingsTitle')}
                            </div>
                         </AccordionTrigger>
                         <AccordionContent className="pt-6">
                            <Card className="bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <Server className="h-5 w-5 text-primary" />
                                        {t('environmentConfiguration')}
                                    </CardTitle>
                                    <CardDescription>{t('environmentConfigurationDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Tabs defaultValue="production" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="production">{t('production')}</TabsTrigger>
                                            <TabsTrigger value="backup">{t('backup')}</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="production">
                                            <Card className="mt-4">
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <div>
                                                        <CardTitle>{t('productionEnvSettings')}</CardTitle>
                                                        <CardDescription>{t('productionEnvSettingsDesc')}</CardDescription>
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => copyEnvFile('production')}>
                                                        <Copy className="mr-2 h-4 w-4"/>
                                                        {t('copy')}
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {renderFirebaseConfigFields('production')}
                                                     <FormField control={envForm.control} name="environments.production.geminiApiKey" render={({ field }) => (<FormItem><FormLabel>{t('geminiApiKey')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                     <FormField control={envForm.control} name="environments.production.resendApiKey" render={({ field }) => (<FormItem><FormLabel>{t('resendApiKey')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="backup">
                                            <Card className="mt-4">
                                                 <CardHeader className="flex flex-row items-center justify-between">
                                                    <div>
                                                        <CardTitle>{t('backupEnvSettings')}</CardTitle>
                                                        <CardDescription>{t('backupEnvSettingsDesc')}</CardDescription>
                                                    </div>
                                                     <Button type="button" variant="outline" size="sm" onClick={() => copyEnvFile('backup')}>
                                                        <Copy className="mr-2 h-4 w-4"/>
                                                        {t('copy')}
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {renderFirebaseConfigFields('backup')}
                                                     <FormField control={envForm.control} name="environments.backup.geminiApiKey" render={({ field }) => (<FormItem><FormLabel>{t('geminiApiKey')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                     <FormField control={envForm.control} name="environments.backup.resendApiKey" render={({ field }) => (<FormItem><FormLabel>{t('resendApiKey')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                         </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                     <Button type="submit" disabled={envForm.formState.isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {envForm.formState.isSubmitting ? t('saving') : t('saveEnvSettings')}
                    </Button>
                </form>
             </Form>

             <div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSettingsSubmit)} className="space-y-8">
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
                                                        <FormItem><FormLabel>{t('ogTitle')} ({t('spanish')})</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name="ogTitle.en" render={({ field }) => (
                                                        <FormItem><FormLabel>{t('ogTitle')} ({t('english')})</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="ogDescription.es" render={({ field }) => (
                                                        <FormItem><FormLabel>{t('ogDescription')} ({t('spanish')})</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name="ogDescription.en" render={({ field }) => (
                                                        <FormItem><FormLabel>{t('ogDescription')} ({t('english')})</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
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
        </div>
    );
}
