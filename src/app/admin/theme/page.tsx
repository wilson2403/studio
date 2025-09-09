
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
import { getThemeSettings, setThemeSettings, ThemeSettings } from '@/lib/firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/admin/ColorPicker';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

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

const defaultTheme: ThemeSettings = {
    light: {
        background: '40 33% 98%',
        foreground: '20 14.3% 4.1%',
        card: '40 33% 98%',
        cardForeground: '20 14.3% 4.1%',
        popover: '40 33% 98%',
        popoverForeground: '20 14.3% 4.1%',
        primary: '125 33% 74%',
        primaryForeground: '125 33% 10%',
        secondary: '210 40% 96.1%',
        secondaryForeground: '222.2 47.4% 11.2%',
        muted: '210 40% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        accent: '47 62% 52%',
        accentForeground: '47 62% 5%',
        destructive: '0 84.2% 60.2%',
        destructiveForeground: '210 40% 98%',
        border: '214.3 31.8% 91.4%',
        input: '214.3 31.8% 91.4%',
        ring: '125 33% 74%',
    },
    dark: {
        background: '140 15% 5%',
        foreground: '140 5% 95%',
        card: '140 10% 8%',
        cardForeground: '140 5% 95%',
        popover: '140 10% 8%',
        popoverForeground: '140 5% 95%',
        primary: '150 40% 45%',
        primaryForeground: '150 40% 95%',
        secondary: '140 10% 12%',
        secondaryForeground: '140 5% 95%',
        muted: '140 10% 12%',
        mutedForeground: '140 5% 64.9%',
        accent: '140 10% 15%',
        accentForeground: '140 5% 95%',
        destructive: '0 63% 31%',
        destructiveForeground: '0 0% 95%',
        border: '140 10% 15%',
        input: '140 10% 15%',
        ring: '150 40% 45%',
    }
};

const predefinedThemes: { name: string; colors: ThemeSettings }[] = [
    { name: 'themeDefault', colors: defaultTheme },
    {
        name: 'themeSunset',
        colors: {
            light: { background: '30 100% 97%', foreground: '20 15% 20%', primary: '15 90% 65%', primaryForeground: '0 0% 100%', secondary: '30 90% 90%', secondaryForeground: '20 15% 20%', muted: '30 90% 90%', mutedForeground: '20 15% 40%', accent: '330 80% 70%', accentForeground: '330 20% 15%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '30 50% 85%', input: '30 50% 85%', ring: '15 90% 65%', card: '30 100% 97%', cardForeground: '20 15% 20%', popover: '30 100% 97%', popoverForeground: '20 15% 20%' },
            dark: { background: '270 50% 15%', foreground: '300 30% 95%', primary: '35 90% 60%', primaryForeground: '20 20% 5%', secondary: '260 40% 20%', secondaryForeground: '300 30% 95%', muted: '260 40% 20%', mutedForeground: '300 30% 70%', accent: '350 90% 65%', accentForeground: '350 20% 10%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '260 40% 25%', input: '260 40% 25%', ring: '35 90% 60%', card: '270 50% 15%', cardForeground: '300 30% 95%', popover: '270 50% 15%', popoverForeground: '300 30% 95%' }
        }
    },
    {
        name: 'themeOceanic',
        colors: {
            light: { background: '210 100% 98%', foreground: '220 40% 10%', primary: '200 80% 60%', primaryForeground: '220 50% 5%', secondary: '210 90% 90%', secondaryForeground: '220 40% 10%', muted: '210 90% 90%', mutedForeground: '215 20% 45%', accent: '190 70% 75%', accentForeground: '190 30% 15%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '210 50% 85%', input: '210 50% 85%', ring: '200 80% 60%', card: '210 100% 98%', cardForeground: '220 40% 10%', popover: '210 100% 98%', popoverForeground: '220 40% 10%' },
            dark: { background: '220 40% 5%', foreground: '210 30% 95%', primary: '190 70% 55%', primaryForeground: '190 20% 10%', secondary: '220 40% 12%', secondaryForeground: '210 30% 95%', muted: '220 40% 12%', mutedForeground: '210 30% 70%', accent: '200 80% 60%', accentForeground: '200 20% 5%', destructive: '0 63% 31%', destructiveForeground: '0 0% 100%', border: '220 40% 15%', input: '220 40% 15%', ring: '190 70% 55%', card: '220 40% 8%', cardForeground: '210 30% 95%', popover: '220 40% 8%', popoverForeground: '210 30% 95%' }
        }
    },
    {
        name: 'themeForest',
        colors: {
            light: { background: '110 30% 97%', foreground: '120 25% 15%', primary: '120 40% 40%', primaryForeground: '110 50% 98%', secondary: '110 20% 90%', secondaryForeground: '120 25% 15%', muted: '110 20% 90%', mutedForeground: '120 15% 40%', accent: '100 35% 60%', accentForeground: '100 20% 10%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '110 20% 85%', input: '110 20% 85%', ring: '120 40% 40%', card: '110 30% 97%', cardForeground: '120 25% 15%', popover: '110 30% 97%', popoverForeground: '120 25% 15%' },
            dark: { background: '120 25% 8%', foreground: '110 30% 95%', primary: '110 35% 55%', primaryForeground: '110 15% 10%', secondary: '120 20% 12%', secondaryForeground: '110 30% 95%', muted: '120 20% 12%', mutedForeground: '110 30% 70%', accent: '90 40% 50%', accentForeground: '90 15% 95%', destructive: '0 70% 40%', destructiveForeground: '0 0% 100%', border: '120 20% 15%', input: '120 20% 15%', ring: '110 35% 55%', card: '120 25% 10%', cardForeground: '110 30% 95%', popover: '120 25% 10%', popoverForeground: '110 30% 95%' }
        }
    },
    {
        name: 'themeSlate',
        colors: {
            light: { background: '220 20% 98%', foreground: '220 15% 20%', primary: '225 30% 50%', primaryForeground: '220 30% 98%', secondary: '220 15% 94%', secondaryForeground: '220 15% 20%', muted: '220 15% 94%', mutedForeground: '220 10% 45%', accent: '215 25% 65%', accentForeground: '215 20% 10%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '220 15% 88%', input: '220 15% 88%', ring: '225 30% 50%', card: '220 20% 98%', cardForeground: '220 15% 20%', popover: '220 20% 98%', popoverForeground: '220 15% 20%' },
            dark: { background: '220 15% 10%', foreground: '210 20% 95%', primary: '215 25% 55%', primaryForeground: '215 15% 98%', secondary: '220 15% 15%', secondaryForeground: '210 20% 95%', muted: '220 15% 15%', mutedForeground: '210 20% 70%', accent: '225 30% 40%', accentForeground: '225 15% 95%', destructive: '0 63% 31%', destructiveForeground: '0 0% 100%', border: '220 15% 20%', input: '220 15% 20%', ring: '215 25% 55%', card: '220 15% 12%', cardForeground: '210 20% 95%', popover: '220 15% 12%', popoverForeground: '210 20% 95%' }
        }
    }
];

function applyTheme(settings: ThemeSettings) {
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
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    const themeForm = useForm<ThemeFormValues>({
        resolver: zodResolver(themeFormSchema),
        defaultValues: defaultTheme,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser || !currentUser.email || !ADMIN_EMAILS.includes(currentUser.email)) {
                router.push('/');
                return;
            }
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        async function loadTheme() {
            setLoadingTheme(true);
            const settings = await getThemeSettings();
            const initialTheme = settings || defaultTheme;
            themeForm.reset(initialTheme);
            applyTheme(initialTheme);
            setLoadingTheme(false);
        }
        loadTheme();
    }, [themeForm]);

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
    }, [watchedValues, loadingTheme, themeFormSchema]);


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
    
    const colorFields: { name: keyof ThemeFormValues['light'], label: string }[] = [
        { name: 'primary', label: t('themePrimaryLabel') },
        { name: 'primaryForeground', label: t('themePrimaryForegroundLabel') },
        { name: 'background', label: t('themeBackgroundLabel') },
        { name: 'foreground', label: t('themeForegroundLabel') },
        { name: 'card', label: t('themeCardLabel') },
        { name: 'cardForeground', label: t('themeCardForegroundLabel') },
        { name: 'accent', label: t('themeAccentLabel') },
        { name: 'accentForeground', label: t('themeAccentForegroundLabel') },
        { name: 'secondary', label: t('themeSecondaryLabel') },
        { name: 'secondaryForeground', label: t('themeSecondaryForegroundLabel') },
        { name: 'muted', label: t('themeMutedLabel') },
        { name: 'mutedForeground', label: t('themeMutedForegroundLabel') },
        { name: 'destructive', label: t('themeDestructiveLabel') },
        { name: 'border', label: t('themeBorderLabel') },
        { name: 'input', label: t('themeInputLabel') },
        { name: 'ring', label: t('themeRingLabel') },
    ];


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
                                    <Button key={theme.name} type="button" variant="outline" onClick={() => handleApplyTheme(theme.colors)}>
                                        {t(theme.name)}
                                    </Button>
                                    ))}
                                </div>
                            </div>
                            <Separator/>
                            <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-headline">{t('themeLight')}</h3>
                                {colorFields.map(field => renderColorField(field.name, field.name, field.label, 'light'))}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-headline">{t('themeDark')}</h3>
                                {colorFields.map(field => renderColorField(field.name, field.name, field.label, 'dark'))}
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

    
