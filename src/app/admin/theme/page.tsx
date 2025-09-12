
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
import { getThemeSettings, setThemeSettings, ThemeSettings, getPredefinedThemes, PredefinedTheme, savePredefinedTheme, deletePredefinedTheme } from '@/lib/firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Trash2 } from 'lucide-react';
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
import { useTheme } from 'next-themes';

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
    console.warn("applyTheme called with invalid settings.");
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
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { setTheme: setNextTheme } = useTheme();

    const themeForm = useForm<ThemeFormValues>({
        resolver: zodResolver(themeFormSchema),
    });
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingTheme(true);
            try {
                const predefined = await getPredefinedThemes();
                setPredefinedThemes(predefined);

                const cachedThemeId = localStorage.getItem('activeThemeId');
                const themeIdToApply = cachedThemeId || predefined.find(p => p.id === 'default')?.id || predefined[0]?.id;
                
                if (themeIdToApply) {
                    const theme = predefined.find(p => p.id === themeIdToApply);
                    if (theme) {
                        applyTheme(theme.colors);
                        setActiveThemeId(theme.id);
                    }
                }

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
    }, [router, t, toast]);


    const handleApplyTheme = (theme: PredefinedTheme) => {
        applyTheme(theme.colors);
        setActiveThemeId(theme.id);
        localStorage.setItem('activeThemeId', theme.id);
    };
    
    const handleSaveAsNewTheme = async () => {
        const currentThemeColors = predefinedThemes.find(t => t.id === activeThemeId)?.colors;
        if(!currentThemeColors) return;

        const themeName = prompt(t('enterNewThemeName'));
        if (!themeName) return;

        const newTheme: PredefinedTheme = {
            id: uuidv4(),
            name: themeName,
            colors: currentThemeColors
        };
        try {
            await savePredefinedTheme(newTheme);
            setPredefinedThemes(prev => [...prev, newTheme]);
            toast({ title: t('themeSavedSuccess') });
        } catch (error) {
            toast({ title: t('themeSavedError'), variant: 'destructive' });
        }
    };

    const handleDeleteTheme = async (themeId: string) => {
         try {
            await deletePredefinedTheme(themeId);
            setPredefinedThemes(prev => prev.filter(t => t.id !== themeId));
            if(activeThemeId === themeId) {
                const defaultTheme = predefinedThemes.find(t => t.id === 'default') || predefinedThemes[0];
                if (defaultTheme) handleApplyTheme(defaultTheme);
            }
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
                        <Skeleton className="h-24 w-full" />
                    ) : (
                       <div>
                            <h3 className="text-xl font-headline mb-4">{t('predefinedThemes')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {predefinedThemes.map(theme => (
                                    <div key={theme.id} className="group relative">
                                        <Button 
                                            type="button" 
                                            variant={activeThemeId === theme.id ? 'default' : 'outline'} 
                                            onClick={() => handleApplyTheme(theme)}>
                                            {theme.name}
                                        </Button>
                                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6" disabled={theme.id === 'default'}>
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
                                <Button type="button" variant="secondary" onClick={handleSaveAsNewTheme}>
                                    <Save className="mr-2 h-4 w-4"/>
                                    {t('saveAsNewTheme')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}

