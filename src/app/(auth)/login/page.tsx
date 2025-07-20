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
import { signInWithGoogle, signInWithEmail } from '@/lib/firebase/auth';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

const formSchema = (t: (key: string) => string) => z.object({
  email: z.string().email({
    message: t('errorInvalidEmail'),
  }),
  password: z.string().min(6, {
    message: t('errorMinLength', { field: t('loginPasswordLabel'), count: 6 }),
  }),
});


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    try {
      await signInWithEmail(values.email, values.password);
      toast({
        title: t('loginSuccessTitle'),
        description: t('loginSuccessDescription'),
      });
      router.push('/');
    } catch (error: any) {
      toast({
        title: t('loginErrorTitle'),
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
          <CardTitle className="font-headline text-3xl">{t('loginWelcome')}</CardTitle>
          <CardDescription className="font-body">
            {t('loginSubtext')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="mr-2" />
            {t('loginWithGoogle')}
          </Button>
          <div className="my-4 flex items-center">
            <Separator className="flex-1" />
            <span className="mx-4 text-xs text-muted-foreground">{t('loginContinueWith')}</span>
            <Separator className="flex-1" />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="submit" className="w-full">
                {t('loginButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('loginNoAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('loginSignUpHere')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
