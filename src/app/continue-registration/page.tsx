
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { countryCodes } from '@/lib/country-codes';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { EditableTitle } from '@/components/home/EditableTitle';
import { EditableProvider } from '@/components/home/EditableProvider';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

const formSchema = (t: (key: string, options?: any) => string) => z.object({
    countryCode: z.string().optional(),
    phone: z.string().optional(),
}).refine(data => !data.phone || (data.phone && data.countryCode), {
    message: t('errorCountryCodeRequired'),
    path: ['countryCode'],
});

export default function ContinueRegistrationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser || !sessionStorage.getItem('isNewGoogleUser')) {
            router.push(redirectUrl || '/');
        } else {
            setUser(currentUser);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [router, redirectUrl]);

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      countryCode: 'CR-+506',
      phone: '',
    },
  });

  const onSubmit = async (values: z.infer<ReturnType<typeof formSchema>>) => {
    if (!user) return;
    
    try {
        const dialCode = values.countryCode ? values.countryCode.split('-')[1] : '';
        const phoneNumber = values.phone ? values.phone.replace(/\D/g, '') : '';
        const fullPhoneNumber = phoneNumber ? `${dialCode}${phoneNumber}` : undefined;

        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            providerId: 'google.com',
            role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
            questionnaireCompleted: false,
            status: 'Interesado',
            phone: fullPhoneNumber,
        });

        toast({
            title: t('googleSuccessTitle'),
            description: t('googleSuccessDescription'),
        });

        sessionStorage.removeItem('isNewGoogleUser');
        router.push(redirectUrl || '/');

    } catch (error: any) {
      toast({
        title: t('registerErrorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  const handleSkip = async () => {
    if (!user) return;
     try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            providerId: 'google.com',
            role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
            questionnaireCompleted: false,
            status: 'Interesado',
        });
        sessionStorage.removeItem('isNewGoogleUser');
        router.push(redirectUrl || '/');
     } catch (error: any) {
         toast({ title: t('registerErrorTitle'), description: error.message, variant: 'destructive' });
     }
  }
  
  if(loading || !user) {
      return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Skeleton className="h-96 w-full max-w-md" />
        </div>
      );
  }

  return (
    <EditableProvider>
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">
                    <EditableTitle
                        tag="h2"
                        id="welcomeUserTitle"
                        initialValue={t('welcomeUser', { name: user.displayName || 'User' })}
                    />
                </CardTitle>
                <CardDescription className="font-body">
                    <EditableTitle
                        tag="p"
                        id="continueRegistrationDescription"
                        initialValue={t('continueRegistrationDescription')}
                    />
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                    <FormLabel>{t('registerPhoneLabel')}</FormLabel>
                    <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormControl>
                                    <Input type="tel" placeholder={t('registerPhonePlaceholder')} {...field} />
                                </FormControl>
                            )}
                        />
                    </div>
                    <FormMessage>{form.formState.errors.countryCode?.message}</FormMessage>
                </FormItem>
                <Button type="submit" className="w-full">
                    {t('continue')}
                </Button>
                </form>
            </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button variant="link" onClick={handleSkip}>
                     <EditableTitle
                        tag="span"
                        id="skipForNowButton"
                        initialValue={t('skipForNow')}
                    />
                </Button>
            </CardFooter>
        </Card>
        </div>
    </EditableProvider>
  );
}
