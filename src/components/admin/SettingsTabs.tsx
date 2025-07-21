
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
import { useEffect, useState } from 'react';
import { getUserProfile, updateUserProfile, getThemeSettings, setThemeSettings, ThemeSettings } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Palette, Save } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';


const profileFormSchema = (t: (key: string) => string) => z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

const themeFormSchema = z.object({
  primary: z.string(),
  background: z.string(),
  accent: z.string(),
});

type ProfileFormValues = z.infer<ReturnType<typeof profileFormSchema>>;
type ThemeFormValues = z.infer<typeof themeFormSchema>;


export default function SettingsTabs({ user }: { user: User }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTheme, setLoadingTheme] = useState(true);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema(t)),
    defaultValues: {
      phone: '',
      address: '',
    },
  });

  const themeForm = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      primary: '150 40% 45%',
      background: '20 14.3% 4.1%',
      accent: '140 10% 15%',
    },
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
  
  const applyTheme = (settings: ThemeSettings) => {
      const root = document.querySelector('.dark') as HTMLElement;
      if (root) {
        root.style.setProperty('--primary', settings.primary);
        root.style.setProperty('--background', settings.background);
        root.style.setProperty('--accent', settings.accent);
      }
  };

  useEffect(() => {
    async function loadTheme() {
        setLoadingTheme(true);
        const settings = await getThemeSettings();
        if (settings) {
            themeForm.reset(settings);
            applyTheme(settings);
        } else {
            // Apply default if no settings found
             const defaultSettings = themeForm.getValues();
             applyTheme(defaultSettings);
        }
        setLoadingTheme(false);
    }
    loadTheme();
  }, [themeForm]);


  const handleThemeChange = (values: ThemeFormValues) => {
    applyTheme(values);
  };

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
      toast({ title: t('themeUpdatedSuccess') });
    } catch (error) {
      toast({ title: t('themeUpdatedError'), variant: 'destructive' });
    }
  };


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
                        onChange={() => handleThemeChange(themeForm.getValues())}
                        className="space-y-6"
                    >
                         <FormField
                            control={themeForm.control}
                            name="primary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('themePrimaryLabel')} (HSL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="150 40% 45%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={themeForm.control}
                            name="background"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('themeBackgroundLabel')} (HSL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="20 14.3% 4.1%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={themeForm.control}
                            name="accent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('themeAccentLabel')} (HSL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="140 10% 15%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
