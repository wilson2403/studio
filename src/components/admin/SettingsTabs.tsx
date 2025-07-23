
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile, getThemeSettings, setThemeSettings, ThemeSettings } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Palette, Save } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { ColorPicker } from './ColorPicker';


const profileFormSchema = (t: (key: string) => string) => z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

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

type ProfileFormValues = z.infer<ReturnType<typeof profileFormSchema>>;
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
            light: { background: '210 100% 98%', foreground: '220 30% 20%', primary: '220 90% 70%', primaryForeground: '220 30% 10%', secondary: '200 80% 92%', secondaryForeground: '220 30% 20%', muted: '200 80% 92%', mutedForeground: '220 30% 50%', accent: '180 60% 50%', accentForeground: '180 30% 98%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '200 60% 85%', input: '200 60% 85%', ring: '220 90% 70%', card: '210 100% 98%', cardForeground: '220 30% 20%', popover: '210 100% 98%', popoverForeground: '220 30% 20%' },
            dark: { background: '220 40% 12%', foreground: '210 50% 95%', primary: '200 80% 60%', primaryForeground: '210 30% 10%', secondary: '230 30% 20%', secondaryForeground: '210 50% 95%', muted: '230 30% 20%', mutedForeground: '210 50% 70%', accent: '190 70% 45%', accentForeground: '190 30% 95%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '230 20% 25%', input: '230 20% 25%', ring: '200 80% 60%', card: '220 40% 12%', cardForeground: '210 50% 95%', popover: '220 40% 12%', popoverForeground: '210 50% 95%' }
        }
    },
    {
        name: 'themeRoseQuartz',
        colors: {
            light: { background: '30 60% 97%', foreground: '350 20% 25%', primary: '350 75% 75%', primaryForeground: '350 30% 10%', secondary: '345 80% 94%', secondaryForeground: '350 20% 25%', muted: '345 80% 94%', mutedForeground: '350 20% 50%', accent: '330 60% 55%', accentForeground: '330 20% 98%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '350 50% 88%', input: '350 50% 88%', ring: '350 75% 75%', card: '30 60% 97%', cardForeground: '350 20% 25%', popover: '30 60% 97%', popoverForeground: '350 20% 25%' },
            dark: { background: '350 20% 18%', foreground: '340 30% 95%', primary: '355 90% 80%', primaryForeground: '355 20% 15%', secondary: '340 15% 25%', secondaryForeground: '340 30% 95%', muted: '340 15% 25%', mutedForeground: '340 30% 60%', accent: '0 50% 60%', accentForeground: '0 20% 98%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '340 10% 30%', input: '340 10% 30%', ring: '355 90% 80%', card: '350 20% 18%', cardForeground: '340 30% 95%', popover: '350 20% 18%', popoverForeground: '340 30% 95%' }
        }
    },
    {
        name: 'themeEarthy',
        colors: {
            light: { background: '40 30% 96%', foreground: '25 25% 20%', primary: '25 60% 60%', primaryForeground: '25 20% 5%', secondary: '30 40% 90%', secondaryForeground: '25 25% 20%', muted: '30 40% 90%', mutedForeground: '25 25% 45%', accent: '80 30% 50%', accentForeground: '80 20% 98%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '30 30% 85%', input: '30 30% 85%', ring: '25 60% 60%', card: '40 30% 96%', cardForeground: '25 25% 20%', popover: '40 30% 96%', popoverForeground: '25 25% 20%' },
            dark: { background: '30 20% 15%', foreground: '40 30% 95%', primary: '40 40% 50%', primaryForeground: '40 20% 5%', secondary: '20 15% 22%', secondaryForeground: '40 30% 95%', muted: '20 15% 22%', mutedForeground: '40 30% 60%', accent: '60 25% 30%', accentForeground: '60 30% 95%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '20 10% 28%', input: '20 10% 28%', ring: '40 40% 50%', card: '30 20% 15%', cardForeground: '40 30% 95%', popover: '30 20% 15%', popoverForeground: '40 30% 95%' }
        }
    },
    {
        name: 'themeSlate',
        colors: {
            light: { background: '210 20% 98%', foreground: '220 20% 20%', primary: '215 20% 65%', primaryForeground: '215 20% 98%', secondary: '220 15% 94%', secondaryForeground: '220 20% 20%', muted: '220 15% 94%', mutedForeground: '220 20% 50%', accent: '210 15% 50%', accentForeground: '210 15% 98%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '220 15% 88%', input: '220 15% 88%', ring: '215 20% 65%', card: '210 20% 98%', cardForeground: '220 20% 20%', popover: '210 20% 98%', popoverForeground: '220 20% 20%' },
            dark: { background: '220 15% 20%', foreground: '210 30% 95%', primary: '220 15% 80%', primaryForeground: '220 20% 10%', secondary: '225 10% 28%', secondaryForeground: '210 30% 95%', muted: '225 10% 28%', mutedForeground: '210 30% 60%', accent: '240 5% 30%', accentForeground: '240 10% 95%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '225 10% 35%', input: '225 10% 35%', ring: '220 15% 80%', card: '220 15% 20%', cardForeground: '210 30% 95%', popover: '220 15% 20%', popoverForeground: '210 30% 95%' }
        }
    },
    {
        name: 'themeNoir',
        colors: {
            light: { background: '0 0% 98%', foreground: '0 0% 5%', primary: '0 0% 20%', primaryForeground: '0 0% 98%', secondary: '0 0% 94%', secondaryForeground: '0 0% 5%', muted: '0 0% 94%', mutedForeground: '0 0% 50%', accent: '0 0% 40%', accentForeground: '0 0% 98%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '0 0% 88%', input: '0 0% 88%', ring: '0 0% 20%', card: '0 0% 98%', cardForeground: '0 0% 5%', popover: '0 0% 98%', popoverForeground: '0 0% 5%' },
            dark: { background: '0 0% 5%', foreground: '0 0% 95%', primary: '0 0% 80%', primaryForeground: '0 0% 5%', secondary: '0 0% 12%', secondaryForeground: '0 0% 95%', muted: '0 0% 12%', mutedForeground: '0 0% 60%', accent: '0 0% 20%', accentForeground: '0 0% 95%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '0 0% 15%', input: '0 0% 15%', ring: '0 0% 80%', card: '0 0% 5%', cardForeground: '0 0% 95%', popover: '0 0% 5%', popoverForeground: '0 0% 95%' }
        }
    },
    {
        name: 'themeNeon',
        colors: {
            light: { background: '250 30% 98%', foreground: '280 50% 10%', primary: '280 90% 60%', primaryForeground: '280 50% 98%', secondary: '300 100% 97%', secondaryForeground: '280 50% 10%', muted: '300 100% 97%', mutedForeground: '280 50% 40%', accent: '180 100% 50%', accentForeground: '180 50% 5%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '300 100% 90%', input: '300 100% 90%', ring: '280 90% 60%', card: '250 30% 98%', cardForeground: '280 50% 10%', popover: '250 30% 98%', popoverForeground: '280 50% 10%' },
            dark: { background: '250 30% 7%', foreground: '300 100% 95%', primary: '300 100% 70%', primaryForeground: '300 50% 10%', secondary: '280 50% 12%', secondaryForeground: '300 100% 95%', muted: '280 50% 12%', mutedForeground: '300 100% 70%', accent: '160 90% 55%', accentForeground: '160 50% 5%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '280 50% 18%', input: '280 50% 18%', ring: '300 100% 70%', card: '250 30% 7%', cardForeground: '300 100% 95%', popover: '250 30% 7%', popoverForeground: '300 100% 95%' }
        }
    },
    {
        name: 'themeForest',
        colors: {
            light: { background: '100 20% 97%', foreground: '120 25% 15%', primary: '130 40% 50%', primaryForeground: '130 20% 98%', secondary: '110 30% 92%', secondaryForeground: '120 25% 15%', muted: '110 30% 92%', mutedForeground: '120 25% 45%', accent: '80 40% 55%', accentForeground: '80 20% 5%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '110 20% 88%', input: '110 20% 88%', ring: '130 40% 50%', card: '100 20% 97%', cardForeground: '120 25% 15%', popover: '100 20% 97%', popoverForeground: '120 25% 15%' },
            dark: { background: '120 25% 10%', foreground: '100 20% 95%', primary: '110 40% 60%', primaryForeground: '110 25% 10%', secondary: '130 20% 15%', secondaryForeground: '100 20% 95%', muted: '130 20% 15%', mutedForeground: '100 20% 65%', accent: '90 30% 30%', accentForeground: '90 20% 95%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '130 15% 20%', input: '130 15% 20%', ring: '110 40% 60%', card: '120 25% 10%', cardForeground: '100 20% 95%', popover: '120 25% 10%', popoverForeground: '100 20% 95%' }
        }
    },
    {
        name: 'themeRoyal',
        colors: {
            light: { background: '45 50% 96%', foreground: '250 25% 20%', primary: '260 60% 55%', primaryForeground: '260 30% 98%', secondary: '250 40% 93%', secondaryForeground: '250 25% 20%', muted: '250 40% 93%', mutedForeground: '250 25% 50%', accent: '45 90% 60%', accentForeground: '45 25% 10%', destructive: '0 84.2% 60.2%', destructiveForeground: '0 0% 100%', border: '250 30% 88%', input: '250 30% 88%', ring: '260 60% 55%', card: '45 50% 96%', cardForeground: '250 25% 20%', popover: '45 50% 96%', popoverForeground: '250 25% 20%' },
            dark: { background: '250 25% 12%', foreground: '240 30% 95%', primary: '45 90% 60%', primaryForeground: '45 25% 10%', secondary: '260 20% 18%', secondaryForeground: '240 30% 95%', muted: '260 20% 18%', mutedForeground: '240 30% 65%', accent: '260 60% 55%', accentForeground: '260 30% 98%', destructive: '0 70% 50%', destructiveForeground: '0 0% 100%', border: '260 15% 22%', input: '260 15% 22%', ring: '45 90% 60%', card: '250 25% 12%', cardForeground: '240 30% 95%', popover: '250 25% 12%', popoverForeground: '240 30% 95%' }
        }
    }
];

function applyTheme(settings: ThemeSettings) {
  // Add a guard clause to prevent error if settings or its properties are null/undefined
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


export default function SettingsTabs({ user }: { user: User }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTheme, setLoadingTheme] = useState(true);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema(t)),
    defaultValues: { phone: '', address: '' },
  });

  const themeForm = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: defaultTheme,
  });

  const handleApplyTheme = (theme: ThemeSettings) => {
    themeForm.reset(theme);
    applyTheme(theme);
  };

  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      const profile = await getUserProfile(user.uid);
      if (profile) {
        profileForm.reset({
          phone: profile.phone || '',
          address: profile.address || '',
        });
      }
      setLoadingProfile(false);
    }
    loadProfile();
  }, [user.uid, profileForm]);
  
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

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      await updateUserProfile(user.uid, data);
      toast({ title: t('profileUpdatedSuccess') });
    } catch (error) {
      toast({ title: t('profileUpdatedError'), variant: 'destructive' });
    }
  };
  
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
    { name: 'muted', label: t('themeMutedLabel') },
    { name: 'destructive', label: t('themeDestructiveLabel') },
    { name: 'border', label: t('themeBorderLabel') },
    { name: 'input', label: t('themeInputLabel') },
    { name: 'ring', label: t('themeRingLabel') },
  ];

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile"><UserIcon className="mr-2 h-4 w-4"/>{t('profileTab')}</TabsTrigger>
        <TabsTrigger value="theme"><Palette className="mr-2 h-4 w-4"/>{t('themeTab')}</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t('profileTabTitle')}</CardTitle>
            <CardDescription>{t('profileTabDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
             {loadingProfile ? (
                 <div className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-1/4" />
                 </div>
             ) : (
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('profilePhoneLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+506 8888-8888" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('profileAddressLabel')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('profileAddressPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                            <Save className="mr-2 h-4 w-4"/>
                            {profileForm.formState.isSubmitting ? t('saving') : t('saveChanges')}
                        </Button>
                    </form>
                </Form>
             )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="theme">
        <Form {...themeForm}>
            <form 
                onSubmit={themeForm.handleSubmit(onThemeSubmit)} 
                className="space-y-6"
            >
            <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>{t('themeTabTitle')}</CardTitle>
                <CardDescription>{t('themeTabDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingTheme ? (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        <Skeleton className="h-10 w-1/4" />
                    </div>
                ) : (
                  <>
                    <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4">{t('predefinedThemes')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {predefinedThemes.map(theme => (
                                <div key={theme.name}>
                                    <Card className="overflow-hidden">
                                        <div className="h-16 flex">
                                            <div style={{ backgroundColor: `hsl(${theme.colors.light.primary})`}} className="w-1/2"></div>
                                            <div style={{ backgroundColor: `hsl(${theme.colors.dark.primary})`}} className="w-1/2"></div>
                                        </div>
                                        <CardContent className="p-3">
                                            <p className="font-semibold text-sm truncate">{t(theme.name)}</p>
                                        </CardContent>
                                    </Card>
                                     <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => handleApplyTheme(theme.colors)}
                                    >
                                        {t('applyTheme')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator className="my-8" />
                    <div className='space-y-8'>
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('themeLight')}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {colorFields.map(cf => renderColorField(`light-${cf.name}`, cf.name, cf.label, 'light'))}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('themeDark')}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {colorFields.map(cf => renderColorField(`dark-${cf.name}`, cf.name, cf.label, 'dark'))}
                            </div>
                        </div>
                    </div>
                  </>
                )}
            </CardContent>
            </Card>
            <Button type="submit" disabled={themeForm.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4"/>
                {themeForm.formState.isSubmitting ? t('saving') : t('saveAndReload')}
            </Button>
            </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
