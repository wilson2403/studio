'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { User } from 'firebase/auth';
import { getUserProfile, updateUserProfile } from '@/lib/firebase/firestore';
import { updateUserEmail, updateUserPassword } from '@/lib/firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { countryCodes } from '@/lib/country-codes';
import { Separator } from '../ui/separator';

const profileSchema = (t: (key: string, options?: any) => string) => z.object({
    displayName: z.string().min(2, { message: t('errorMinLength', { field: t('registerNameLabel'), count: 2 }) }),
    countryCode: z.string().optional(),
    phone: z.string().optional(),
}).refine(data => !data.phone || (data.phone && data.countryCode), {
    message: "Por favor, selecciona un código de país.",
    path: ['countryCode'],
});

const emailSchema = (t: (key: string, options?: any) => string) => z.object({
  email: z.string().email({ message: t('errorInvalidEmail') }),
});

const passwordSchema = (t: (key: string, options?: any) => string) => z.object({
  newPassword: z.string().min(6, { message: t('errorMinLength', { field: t('loginPasswordLabel'), count: 6 }) }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: t('errorPasswordsDontMatch'),
  path: ['confirmPassword'],
});


type ProfileFormValues = z.infer<ReturnType<typeof profileSchema>>;
type EmailFormValues = z.infer<ReturnType<typeof emailSchema>>;
type PasswordFormValues = z.infer<ReturnType<typeof passwordSchema>>;

interface EditProfileDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileDialog({ user, isOpen, onClose }: EditProfileDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema(t)),
    defaultValues: { displayName: '', countryCode: 'CR-+506', phone: '' },
  });
  
  const emailForm = useForm<EmailFormValues>({
      resolver: zodResolver(emailSchema(t)),
      defaultValues: { email: '' },
  })

  const passwordForm = useForm<PasswordFormValues>({
      resolver: zodResolver(passwordSchema(t)),
      defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
            const [code, dial_code] = profile.phone?.match(/^(\+\d+)(\d+)$/)?.slice(1) || ['', ''];
            const country = countryCodes.find(c => c.dial_code === code);
            
            profileForm.reset({
                displayName: profile.displayName || '',
                countryCode: country ? `${country.code}-${country.dial_code}` : 'CR-+506',
                phone: dial_code || profile.phone || '',
            });
            emailForm.reset({
                email: profile.email || '',
            })
        }
      }
    }
    if (isOpen) {
      loadProfile();
    }
  }, [user, isOpen, profileForm, emailForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    try {
        const dialCode = data.countryCode ? data.countryCode.split('-')[1] : undefined;
        const fullPhoneNumber = data.phone && dialCode
            ? `${dialCode}${data.phone.replace(/\D/g, '')}`
            : undefined;

      await updateUserProfile(user.uid, { displayName: data.displayName, phone: fullPhoneNumber });
      toast({ title: t('profileUpdatedSuccess') });
    } catch (error: any) {
      toast({ title: t('profileUpdatedError'), description: error.message, variant: 'destructive' });
    }
  };
  
  const onEmailSubmit = async (data: EmailFormValues) => {
      if (!user) return;
      try {
          await updateUserEmail(data.email);
          toast({ title: t('emailUpdatedSuccess'), description: t('emailUpdatedSuccessDesc') });
      } catch (error: any) {
          toast({ title: t('emailUpdatedError'), description: error.message, variant: 'destructive' });
      }
  }

  const onPasswordSubmit = async (data: PasswordFormValues) => {
      if (!user) return;
      try {
          await updateUserPassword(data.newPassword);
          toast({ title: t('passwordUpdatedSuccess') });
          passwordForm.reset();
      } catch (error: any) {
          toast({ title: t('passwordUpdatedError'), description: error.message, variant: 'destructive' });
      }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>{t('editProfileTitle')}</DialogTitle>
          <DialogDescription>{t('editProfileDescription')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
            <div className="space-y-6 pr-6">
                {/* Profile Form */}
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                            control={profileForm.control}
                            name="displayName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('registerNameLabel')}</FormLabel>
                                <FormControl>
                                <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>{t('registerPhoneLabel')}</FormLabel>
                            <div className="flex gap-2">
                                <FormField
                                    control={profileForm.control}
                                    name="countryCode"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-32">
                                                    <SelectValue placeholder="Code" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <ScrollArea className="h-72">
                                                    {countryCodes.map(country => (
                                                        <SelectItem key={`${country.code}-${country.dial_code}`} value={`${country.code}-${country.dial_code}`}>
                                                            {country.code} ({country.dial_code})
                                                        </SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormControl>
                                            <Input type="tel" placeholder={t('registerPhonePlaceholder')} {...field} />
                                        </FormControl>
                                    )}
                                />
                            </div>
                            <FormMessage>{profileForm.formState.errors.countryCode?.message}</FormMessage>
                        </FormItem>
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                            {t('saveChanges')}
                        </Button>
                    </form>
                </Form>

                <Separator />

                {/* Email Form */}
                <Form {...emailForm}>
                     <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('loginEmailLabel')}</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <Button type="submit" variant="outline" disabled={emailForm.formState.isSubmitting}>
                            {t('updateEmail')}
                        </Button>
                    </form>
                </Form>

                <Separator />
                
                {/* Password Form */}
                <Form {...passwordForm}>
                     <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                         <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('newPassword')}</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('registerConfirmPasswordLabel')}</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting}>
                            {t('updatePassword')}
                        </Button>
                    </form>
                </Form>
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">{t('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}