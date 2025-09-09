
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { countryCodes } from '@/lib/country-codes';
import { useEffect } from 'react';

const formSchema = (t: (key: string, options?: any) => string) => z
  .object({
    name: z.string().min(2, {
      message: t('errorMinLength', { field: t('registerNameLabel'), count: 2 }),
    }),
    email: z.string().email({
      message: t('errorInvalidEmail'),
    }),
    password: z.string().min(6, {
      message: t('errorMinLength', { field: t('loginPasswordLabel'), count: 6 }),
    }),
    confirmPassword: z.string(),
    countryCode: z.string({ required_error: t('errorCountryCodeRequired') }),
    phone: z.string().min(1, { message: t('errorRequired', { field: t('registerPhoneLabel') }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('errorPasswordsDontMatch'),
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { t, i18n } = useTranslation();
  const langFromQuery = searchParams.get('lang');

  useEffect(() => {
    if (langFromQuery && i18n.language !== langFromQuery) {
        i18n.changeLanguage(langFromQuery);
    }
  }, [langFromQuery, i18n]);

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      countryCode: 'CR-+506',
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    try {
      await signUpWithEmail(values.email, values.password, values.name, values.countryCode, values.phone);
      toast({
        title: t('registerSuccessTitle'),
        description: t('registerSuccessDescription'),
      });
      router.push(redirectUrl || `/artedesanar`);
    } catch (error: any) {
      toast({
        title: t('registerErrorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle();
      toast({
        title: t('googleSuccessTitle'),
        description: t('googleSuccessDescription'),
      });
      router.push(redirectUrl || `/artedesanar`);
    } catch (error: any) {
      toast({
        title: t('googleErrorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{t('registerTitle')}</CardTitle>
          <CardDescription className="font-body">
            {t('registerSubtext')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="mr-2" />
            {t('registerWithGoogle')}
          </Button>
          <div className="my-4 flex items-center">
            <Separator className="flex-1" />
            <span className="mx-4 text-xs text-muted-foreground">{t('registerContinueWith')}</span>
            <Separator className="flex-1" />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registerNameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('registerNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('loginEmailLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('loginEmailPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <FormMessage>{form.formState.errors.phone?.message || form.formState.errors.countryCode?.message}</FormMessage>
              </FormItem>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('loginPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('loginPasswordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registerConfirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('loginPasswordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {t('registerButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('registerHaveAccount')}{' '}
            <Link href={redirectUrl ? `/login?redirect=${redirectUrl}` : `/login?lang=${i18n.language}`} className="text-primary hover:underline">
              {t('registerLoginHere')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
