
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Mail, ShieldCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, getUserProfile, updateUserRole, UserProfile } from '@/lib/firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { sendEmailToAllUsers } from '@/ai/flows/email-flow';

const emailFormSchema = (t: (key: string) => string) => z.object({
    subject: z.string().min(1, t('errorRequired', { field: t('emailSubject') })),
    body: z.string().min(1, t('errorRequired', { field: t('emailBody') })),
});

type EmailFormValues = z.infer<ReturnType<typeof emailFormSchema>>;

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function AdminUsersPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailFormSchema(t)),
        defaultValues: {
            subject: '',
            body: '',
        },
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const allUsers = await getAllUsers();
                setUsers(allUsers);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({ title: "Error", description: "Could not fetch user list.", variant: "destructive" });
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/');
                return;
            }

            const profile = await getUserProfile(currentUser.uid);
            const isAdmin = profile?.isAdmin || currentUser.email === ADMIN_EMAIL;
            
            if (!isAdmin) {
                router.push('/');
                return;
            }

            setUser(currentUser);
            await fetchUsers();
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast]);


    const handleRoleChange = async (uid: string, isAdmin: boolean) => {
        try {
            await updateUserRole(uid, isAdmin);
            setUsers(users.map(u => u.uid === uid ? { ...u, isAdmin } : u));
            toast({ title: t('roleUpdatedSuccess') });
        } catch (error) {
            toast({ title: t('roleUpdatedError'), variant: 'destructive' });
        }
    };

    const onEmailSubmit = async (data: EmailFormValues) => {
        try {
            await sendEmailToAllUsers({ subject: data.subject, body: data.body });
            toast({ title: t('emailsSentSuccess') });
            emailForm.reset();
        } catch (error: any) {
            toast({ title: t('emailsSentError'), description: error.message, variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <div className="space-y-4 w-full">
                    <Skeleton className="h-12 w-1/4 mx-auto" />
                    <Skeleton className="h-8 w-1/2 mx-auto" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('userManagementTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('userManagementSubtitle')}</p>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />{t('usersTab')}</TabsTrigger>
                    <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />{t('emailTab')}</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('allUsersTitle')}</CardTitle>
                            <CardDescription>{t('allUsersDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('userName')}</TableHead>
                                        <TableHead>{t('userEmail')}</TableHead>
                                        <TableHead>{t('userAdmin')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.uid}>
                                            <TableCell>{u.displayName || 'N/A'}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={u.isAdmin || u.email === ADMIN_EMAIL}
                                                    onCheckedChange={(checked) => handleRoleChange(u.uid, checked)}
                                                    disabled={u.email === ADMIN_EMAIL}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="email">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('sendEmailTitle')}</CardTitle>
                            <CardDescription>{t('sendEmailDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...emailForm}>
                                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                                    <FormField
                                        control={emailForm.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('emailSubject')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('emailSubjectPlaceholder')} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={emailForm.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('emailBody')}</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder={t('emailBodyPlaceholder')} {...field} rows={10} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={emailForm.formState.isSubmitting}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        {emailForm.formState.isSubmitting ? t('sending') : t('sendEmailButton')}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
