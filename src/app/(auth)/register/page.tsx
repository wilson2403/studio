'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('errorPasswordsDontMatch'),
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    try {
      await signUpWithEmail(values.email, values.password, values.name);
      toast({
        title: t('registerSuccessTitle'),
        description: t('registerSuccessDescription'),
      });
      router.push('/');
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
      router.push('/');
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
            <Link href="/login" className="text-primary hover:underline">
              {t('registerLoginHere')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
