
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getThemeSettings, setThemeSettings, ThemeSettings, getPredefinedThemes, PredefinedTheme, savePredefinedTheme, deletePredefinedTheme, seedPredefinedThemes } from '@/lib/firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/admin/ColorPicker';
import { Separator } from '@/components/ui/separator';
import { Save, Trash2, UploadCloud } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAILS = ['wilson2403@gmail.com', 'wilson2403@hotmail.com'];

const colorThemeSchema = z.object({
    background: z.string(),
    foreground: z.string(),
    card: z.string(),
    cardForeground: z.string(),
    popover: z.string(),
    popoverForeground: z.string(),
    primary: z.string(),
    primaryForeground: z.string(),
    secondary: z.string(),
    secondaryForeground: z.string(),
    muted: z.string(),
    mutedForeground: z.string(),
    accent: z.string(),
    accentForeground: z.string(),
    destructive: z.string(),
    destructiveForeground: z.string(),
    border: z.string(),
    input: z.string(),
    ring: z.string(),
});

const themeFormSchema = z.object({
  light: colorThemeSchema,
  dark: colorThemeSchema,
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

function applyTheme(settings: ThemeSettings | null) {
  if (!settings || !settings.light || !settings.dark) {
    return;
  }
  const styleId = 'dynamic-theme-styles';
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  
  const lightStyles = Object.entries(settings.light)
    .map(([key, value]) => `--light-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');

  const darkStyles = Object.entries(settings.dark)
    .map(([key, value]) => `--dark-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');

  styleTag.innerHTML = `:root { ${lightStyles} ${darkStyles} }`;
}

export default function ThemePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingTheme, setLoadingTheme] = useState(true);
    const [predefinedThemes, setPredefinedThemes] = useState<PredefinedTheme[]>([]);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    const themeForm = useForm<ThemeFormValues>({
        resolver: zodResolver(themeFormSchema),
    });
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingTheme(true);
            try {
                const [themeSettings, predefined] = await Promise.all([
                    getThemeSettings(),
                    getPredefinedThemes()
                ]);
                
                if (themeSettings) {
                    themeForm.reset(themeSettings);
                    applyTheme(themeSettings);
                } else {
                    const defaultTheme = predefined.find(p => p.name === 'Default');
                    if(defaultTheme) {
                        themeForm.reset(defaultTheme.colors);
                        applyTheme(defaultTheme.colors);
                    }
                }
                setPredefinedThemes(predefined);

            } catch (error) {
                console.error("Failed to load theme data:", error);
                toast({ title: t('themeLoadError'), variant: 'destructive' });
            } finally {
                setLoadingTheme(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || !currentUser.email || !ADMIN_EMAILS.includes(currentUser.email)) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            setLoading(false);
            await fetchInitialData();
        });

        return () => unsubscribe();
    }, [router, themeForm, t, toast]);


    const onThemeSubmit = async (data: ThemeFormValues) => {
        try {
          await setThemeSettings(data);
          applyTheme(data);
          toast({ title: t('themeUpdatedSuccess'), description: t('themeUpdateReload') });
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          toast({ title: t('themeUpdatedError'), variant: 'destructive' });
        }
    };

    const handleApplyTheme = (theme: ThemeSettings) => {
        themeForm.reset(theme);
        applyTheme(theme);
    };
    
    const watchedValues = themeForm.watch();
    useEffect(() => {
        const result = themeFormSchema.safeParse(watchedValues);
        if (result.success && !loadingTheme) {
            applyTheme(result.data);
        }
    }, [watchedValues, loadingTheme]);


    const renderColorField = (key: string, name: keyof ThemeFormValues['light'] | keyof ThemeFormValues['dark'], label: string, theme: 'light' | 'dark') => (
        <FormField
          key={key}
          control={themeForm.control}
          name={`${theme}.${name}` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <div className="flex items-center gap-2">
                <ColorPicker value={field.value} onChange={field.onChange} />
                <FormControl>
                  <Input placeholder="125 33% 74%" {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
    );
    
    const colorFields: { name: keyof ThemeFormValues['light'], labelKey: string }[] = [
        { name: 'primary', labelKey: 'themePrimaryLabel' },
        { name: 'primaryForeground', labelKey: 'themePrimaryForegroundLabel' },
        { name: 'background', labelKey: 'themeBackgroundLabel' },
        { name: 'foreground', labelKey: 'themeForegroundLabel' },
        { name: 'card', labelKey: 'themeCardLabel' },
        { name: 'cardForeground', labelKey: 'themeCardForegroundLabel' },
        { name: 'accent', labelKey: 'themeAccentLabel' },
        { name: 'accentForeground', labelKey: 'themeAccentForegroundLabel' },
        { name: 'secondary', labelKey: 'themeSecondaryLabel' },
        { name: 'secondaryForeground', labelKey: 'themeSecondaryForegroundLabel' },
        { name: 'muted', labelKey: 'themeMutedLabel' },
        { name: 'mutedForeground', labelKey: 'themeMutedForegroundLabel' },
        { name: 'destructive', labelKey: 'themeDestructiveLabel' },
        { name: 'border', labelKey: 'themeBorderLabel' },
        { name: 'input', labelKey: 'themeInputLabel' },
        { name: 'ring', labelKey: 'themeRingLabel' },
    ];

    const handleSaveAsNewTheme = async () => {
        const themeName = prompt(t('enterNewThemeName'));
        if (!themeName) return;

        const newTheme: PredefinedTheme = {
            id: uuidv4(),
            name: themeName,
            colors: themeForm.getValues()
        };
        try {
            await savePredefinedTheme(newTheme);
            setPredefinedThemes(prev => [...prev, newTheme]);
            toast({ title: t('themeSavedSuccess') });
        } catch (error) {
            toast({ title: t('themeSavedError'), variant: 'destructive' });
        }
    };

    const handleUpdateTheme = async (themeId: string) => {
        try {
            const themeToUpdate = predefinedThemes.find(t => t.id === themeId);
            if (!themeToUpdate) return;
            
            const updatedTheme: PredefinedTheme = {
                ...themeToUpdate,
                colors: themeForm.getValues()
            };
            await savePredefinedTheme(updatedTheme);
            setPredefinedThemes(prev => prev.map(t => t.id === themeId ? updatedTheme : t));
            toast({ title: t('themeUpdatedSuccess') });

        } catch (error) {
            toast({ title: t('themeUpdatedError'), variant: 'destructive' });
        }
    };

    const handleDeleteTheme = async (themeId: string) => {
         try {
            await deletePredefinedTheme(themeId);
            setPredefinedThemes(prev => prev.filter(t => t.id !== themeId));
            toast({ title: t('themeDeletedSuccess') });
        } catch (error) {
            toast({ title: t('themeDeletedError'), variant: 'destructive' });
        }
    }


    if (loading) {
        return (
            <div className="container py-12 md:py-16">
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('themeTab')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('themeCustomizationDescription')}</p>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>{t('themeCustomization')}</CardTitle>
                    <CardDescription>{t('themeCustomizationDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingTheme ? (
                        <Skeleton className="h-96 w-full" />
                    ) : (
                        <Form {...themeForm}>
                        <form onSubmit={themeForm.handleSubmit(onThemeSubmit)} className="space-y-8">
                            <div>
                                <h3 className="text-xl font-headline mb-4">{t('predefinedThemes')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {predefinedThemes.map(theme => (
                                        <div key={theme.id} className="group relative">
                                            <Button type="button" variant="outline" onClick={() => handleApplyTheme(theme.colors)}>
                                                {theme.name}
                                            </Button>
                                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type='button' size='icon' className='h-6 w-6 bg-primary/80 hover:bg-primary' onClick={() => handleUpdateTheme(theme.id)}>
                                                    <UploadCloud className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button type="button" variant="destructive" size="icon" className="h-6 w-6">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('deleteThemeConfirmTitle')}</AlertDialogTitle>
                                                        <AlertDialogDescription>{t('deleteThemeConfirmDescription', { name: theme.name })}</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTheme(theme.id)}>{t('delete')}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="secondary" onClick={handleSaveAsNewTheme}>{t('saveAsNewTheme')}</Button>
                                </div>
                            </div>
                            <Separator/>
                            <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-headline">{t('themeLight')}</h3>
                                {colorFields.map(field => renderColorField(field.name, field.name, t(field.labelKey), 'light'))}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-headline">{t('themeDark')}</h3>
                                {colorFields.map(field => renderColorField(field.name, field.name, t(field.labelKey), 'dark'))}
                            </div>
                            </div>
                            <Button type="submit" disabled={themeForm.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4"/>
                                {t('saveChanges')}
                            </Button>
                        </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}

    
