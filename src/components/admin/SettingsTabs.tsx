
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

function applyTheme(settings: ThemeSettings) {
  const styleId = 'dynamic-theme-styles';
  let styleTag = document.getElementById(styleId);
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

  const renderColorField = (name: keyof ThemeFormValues['light'] | keyof ThemeFormValues['dark'], label: string, theme: 'light' | 'dark') => (
    <FormField
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
                    <div className='space-y-8'>
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('themeLight')}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {colorFields.map(cf => renderColorField(cf.name, cf.label, 'light'))}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('themeDark')}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {colorFields.map(cf => renderColorField(cf.name, cf.label, 'dark'))}
                            </div>
                        </div>
                    </div>
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
