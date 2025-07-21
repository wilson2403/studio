
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

const themeFormSchema = z.object({
  lightPrimary: z.string(),
  lightBackground: z.string(),
  lightAccent: z.string(),
  darkPrimary: z.string(),
  darkBackground: z.string(),
  darkAccent: z.string(),
});

type ProfileFormValues = z.infer<ReturnType<typeof profileFormSchema>>;
type ThemeFormValues = z.infer<typeof themeFormSchema>;

const defaultTheme: ThemeSettings = {
    lightPrimary: '125 33% 74%',
    lightBackground: '40 33% 98%',
    lightAccent: '47 62% 52%',
    darkPrimary: '150 40% 45%',
    darkBackground: '20 14.3% 4.1%',
    darkAccent: '140 10% 15%',
};

function applyTheme(settings: ThemeSettings) {
  const existingStyleTag = document.getElementById('dynamic-theme-styles');
  if (existingStyleTag) {
    existingStyleTag.remove();
  }

  const style = document.createElement('style');
  style.id = 'dynamic-theme-styles';
  style.innerHTML = `
    :root {
      --light-primary: ${settings.lightPrimary};
      --light-background: ${settings.lightBackground};
      --light-accent: ${settings.lightAccent};
    }
    .dark {
      --dark-primary: ${settings.darkPrimary};
      --dark-background: ${settings.darkBackground};
      --dark-accent: ${settings.darkAccent};
    }
  `;
  document.head.appendChild(style);
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
      // We still reload to ensure all components pick up the new theme from the applied styles
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({ title: t('themeUpdatedError'), variant: 'destructive' });
    }
  };

  // Watch for form changes and apply them live
  useEffect(() => {
    const subscription = themeForm.watch((value) => {
        // Zod check to ensure the data is valid before applying
        const result = themeFormSchema.safeParse(value);
        if (result.success) {
            applyTheme(result.data as ThemeSettings);
        }
    });
    return () => subscription.unsubscribe();
  }, [themeForm]);

  const renderColorField = (name: keyof ThemeFormValues, label: string) => (
    <FormField
      control={themeForm.control}
      name={name}
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
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t('themeTabTitle')}</CardTitle>
            <CardDescription>{t('themeTabDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTheme ? (
                 <div className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-1/4" />
                 </div>
            ) : (
                <Form {...themeForm}>
                    <form 
                        onSubmit={themeForm.handleSubmit(onThemeSubmit)} 
                        className="space-y-6"
                    >
                        {/* Light Theme */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('themeLight')}</h3>
                            <div className="space-y-4">
                                {renderColorField('lightPrimary', t('themePrimaryLabel'))}
                                {renderColorField('lightBackground', t('themeBackgroundLabel'))}
                                {renderColorField('lightAccent', t('themeAccentLabel'))}
                            </div>
                        </div>

                        <Separator />

                        {/* Dark Theme */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('themeDark')}</h3>
                             <div className="space-y-4">
                                {renderColorField('darkPrimary', t('themePrimaryLabel'))}
                                {renderColorField('darkBackground', t('themeBackgroundLabel'))}
                                {renderColorField('darkAccent', t('themeAccentLabel'))}
                            </div>
                        </div>
                        <Button type="submit" disabled={themeForm.formState.isSubmitting}>
                            <Save className="mr-2 h-4 w-4"/>
                            {themeForm.formState.isSubmitting ? t('saving') : t('saveChanges')}
                        </Button>
                    </form>
                </Form>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
