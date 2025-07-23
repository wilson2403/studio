
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ShieldCheck, Users, FileText, CheckCircle, XCircle, Send, Edit, MessageSquare, Save, PlusCircle, Trash2, BarChart3, History, Star, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, getUserProfile, updateUserRole, UserProfile, updateUserStatus, getInvitationMessages, updateInvitationMessage, addInvitationMessage, deleteInvitationMessage, InvitationMessage, getSectionAnalytics, SectionAnalytics, UserStatus, resetSectionAnalytics } from '@/lib/firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { sendEmailToAllUsers } from '@/ai/flows/email-flow';
import QuestionnaireDialog from '@/components/admin/QuestionnaireDialog';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import EditProfileDialog from '@/components/auth/EditProfileDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import AssignCeremonyDialog from '@/components/admin/AssignCeremonyDialog';
import ViewUserCoursesDialog from '@/components/admin/ViewUserCoursesDialog';

const emailFormSchema = (t: (key: string) => string) => z.object({
    subject: z.string().min(1, t('errorRequired', { field: t('emailSubject') })),
    body: z.string().min(1, t('errorRequired', { field: t('emailBody') })),
});

const messageTemplateSchema = (t: (key: string, options?: any) => string) => z.object({
    id: z.string(),
    name: z.string().min(1, t('errorRequired', { field: t('templateName') })),
    es: z.string().min(1, t('errorRequired', { field: t('templateMessageES') })),
    en: z.string().min(1, t('errorRequired', { field: t('templateMessageEN') })),
});

const messagesFormSchema = (t: (key: string, options?: any) => string) => z.object({
    templates: z.array(messageTemplateSchema(t)),
});

type EmailFormValues = z.infer<ReturnType<typeof emailFormSchema>>;
type MessagesFormValues = z.infer<ReturnType<typeof messagesFormSchema>>;

const ADMIN_EMAIL = 'wilson2403@gmail.com';
const userStatuses: UserStatus[] = ['Interesado', 'Cliente', 'Pendiente'];
const TOTAL_PREPARATION_STEPS = 11;


const defaultInvitationMessage = (t: (key: string) => string): Omit<InvitationMessage, 'id'> => ({
    name: t('defaultInvitationName'),
    es: '¡Hola! Te invitamos a completar el cuestionario médico para continuar con tu proceso de reserva en El Arte de Sanar. Puedes hacerlo aquí: https://artedesanar.vercel.app/artedesanar',
    en: 'Hello! We invite you to complete the medical questionnaire to continue with your reservation process at El Arte de Sanar. You can do it here: https://artedesanar.vercel.app/artedesanar',
});


export default function AdminUsersPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [viewingUserQuestionnaire, setViewingUserQuestionnaire] = useState<UserProfile | null>(null);
    const [viewingUserCourses, setViewingUserCourses] = useState<UserProfile | null>(null);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [invitationTemplates, setInvitationTemplates] = useState<InvitationMessage[]>([]);
    const [invitingUser, setInvitingUser] = useState<UserProfile | null>(null);
    const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [analytics, setAnalytics] = useState<SectionAnalytics[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { toast } = useToast();

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailFormSchema(t)),
        defaultValues: { subject: '', body: '' },
    });

    const messagesForm = useForm<MessagesFormValues>({
        resolver: zodResolver(messagesFormSchema(t)),
        defaultValues: { templates: [] },
    });
    
    const { fields: templateFields, append: appendTemplate, remove: removeTemplate } = useFieldArray({
        control: messagesForm.control,
        name: "templates",
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const allUsers = await getAllUsers();
                setUsers(allUsers);
            } catch (error: any) {
                console.error("Failed to fetch users:", error);
                toast({ title: t('error'), description: t('errorFetchUsers'), variant: "destructive" });
            }
        };

        const fetchInvitationMessages = async () => {
            setLoadingMessages(true);
            let templates = await getInvitationMessages();
            if(templates.length === 0) {
                // Seed with default message if none exist
                const newId = uuidv4();
                const defaultTemplate = { id: newId, ...defaultInvitationMessage(t) };
                await addInvitationMessage(defaultTemplate);
                templates = [defaultTemplate];
            }
            setInvitationTemplates(templates);
            messagesForm.reset({ templates });
            setLoadingMessages(false);
        };
        
        const fetchAnalytics = async () => {
            setLoadingAnalytics(true);
            const data = await getSectionAnalytics();
            setAnalytics(data);
            setLoadingAnalytics(false);
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/'); return;
            }
            const profile = await getUserProfile(currentUser.uid);
            const isAdmin = profile?.isAdmin || currentUser.email === ADMIN_EMAIL;
            if (!isAdmin) {
                router.push('/'); return;
            }
            setUser(currentUser);
            await Promise.all([fetchUsers(), fetchInvitationMessages(), fetchAnalytics()]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t, messagesForm]);


    const handleRoleChange = async (uid: string, isAdmin: boolean) => {
        try {
            await updateUserRole(uid, isAdmin);
            setUsers(users.map(u => u.uid === uid ? { ...u, isAdmin } : u));
            toast({ title: t('roleUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('roleUpdatedError'), variant: 'destructive' });
        }
    };
    
    const handleStatusChange = async (uid: string, status: UserStatus) => {
        try {
            await updateUserStatus(uid, status);
            setUsers(users.map(u => u.uid === uid ? { ...u, status } : u));
            toast({ title: t('statusUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('statusUpdatedError'), variant: 'destructive' });
        }
    };
    
    const handleProfileUpdate = (updatedProfile: Partial<UserProfile>) => {
        if(editingUser) {
            setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, ...updatedProfile } : u));
            setEditingUser(null);
        }
    };
    
    const handleCeremonyAssignmentUpdate = (updatedUser: UserProfile) => {
        setUsers(users.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    }


    const handleSendInvite = (template: InvitationMessage) => {
        if (!invitingUser) return;
        const lang = i18n.language as 'es' | 'en';
        const message = template?.[lang] || template?.es;
        const encodedMessage = encodeURIComponent(message);
        let url = `https://wa.me/`

        if(invitingUser.phone) {
            url += `${invitingUser.phone.replace(/\D/g, '')}?text=${encodedMessage}`
        } else {
            url += `?text=${encodedMessage}`
        }
        
        window.open(url, '_blank');
        toast({ title: t('invitationSent') });
        setInvitingUser(null);
    }

    const onEmailSubmit = async (data: EmailFormValues) => {
        emailForm.control.disabled = true;
        try {
            const result = await sendEmailToAllUsers({ subject: data.subject, body: data.body });
            if (result.success) {
                toast({ title: t('emailsSentSuccess'), description: result.message });
                emailForm.reset();
            } else {
                 toast({ title: t('emailsSentError'), description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: t('emailsSentError'), description: error.message, variant: 'destructive' });
        } finally {
             emailForm.control.disabled = false;
        }
    };
    
    const onMessagesSubmit = async (data: MessagesFormValues) => {
        try {
            // This will batch update all templates
            for (const template of data.templates) {
                await updateInvitationMessage(template);
            }
            setInvitationTemplates(data.templates);
            toast({ title: t('messagesUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('messagesUpdatedError'), variant: 'destructive' });
        }
    };
    
    const handleAddTemplate = async () => {
        const newTemplate: InvitationMessage = {
            id: uuidv4(),
            name: t('newTemplateName', { count: templateFields.length + 1 }),
            es: t('newTemplateMessageES'),
            en: t('newTemplateMessageEN'),
        }
        await addInvitationMessage(newTemplate);
        appendTemplate(newTemplate);
        setInvitationTemplates(prev => [...prev, newTemplate]);
    }
    
    const handleDeleteTemplate = async (templateId: string, index: number) => {
        try {
            await deleteInvitationMessage(templateId);
            removeTemplate(index);
            setInvitationTemplates(prev => prev.filter(t => t.id !== templateId));
            toast({ title: t('templateDeleted') });
        } catch(error: any) {
             toast({ title: t('errorDeletingTemplate'), variant: 'destructive' });
        }
    }
    
    const handleResetAnalytics = async () => {
        try {
            await resetSectionAnalytics();
            setAnalytics([]);
            toast({ title: t('analyticsResetSuccess') });
        } catch (error: any) {
            toast({ title: t('analyticsResetError'), variant: 'destructive' });
        }
    }

    const getPreparationPercentage = (user: UserProfile) => {
        if (user.questionnaireCompleted) return 100;
        const progress = user.preparationStep || 0;
        // The +1 is because steps are 0-indexed, but a user on step 0 has completed 1 step.
        return Math.floor(((progress + 1) / TOTAL_PREPARATION_STEPS) * 100);
    }


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
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto md:h-10">
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />{t('usersTab')}</TabsTrigger>
                    <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />{t('emailTab')}</TabsTrigger>
                    <TabsTrigger value="invitation"><MessageSquare className="mr-2 h-4 w-4"/>{t('invitationTabTitle')}</TabsTrigger>
                    <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/>{t('analyticsTab')}</TabsTrigger>
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
                                        <TableHead>{t('userStatus')}</TableHead>
                                        <TableHead>{t('userQuestionnaire')}</TableHead>
                                        <TableHead>{t('userAdmin')}</TableHead>
                                        <TableHead>{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.uid}>
                                            <TableCell>{u.displayName || 'N/A'}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>
                                                {(u.isAdmin || u.email === ADMIN_EMAIL) ? (
                                                    <div className='flex items-center gap-2 font-semibold text-primary'>
                                                        <ShieldCheck className="h-4 w-4" />
                                                        {t('admin')}
                                                    </div>
                                                ) : (
                                                    <Select
                                                        value={u.status || 'Interesado'}
                                                        onValueChange={(value) => handleStatusChange(u.uid, value as UserStatus)}
                                                    >
                                                        <SelectTrigger className="w-36">
                                                            <SelectValue placeholder={t('selectStatus')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {userStatuses.map(status => (
                                                                <SelectItem key={status} value={status}>
                                                                    {t(`userStatus${status}`)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {u.questionnaireCompleted ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <div className='flex items-center justify-center gap-2'>
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                        <span>({getPreparationPercentage(u)}%)</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={u.isAdmin || u.email === ADMIN_EMAIL}
                                                    onCheckedChange={(checked) => handleRoleChange(u.uid, checked)}
                                                    disabled={u.email === ADMIN_EMAIL}
                                                />
                                            </TableCell>
                                            <TableCell className='flex gap-2 flex-wrap'>
                                                <Button variant="outline" size="sm" onClick={() => setEditingUser(u)}>
                                                    <Edit className="mr-2 h-4 w-4"/>
                                                    {t('editUser')}
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setAssigningUser(u)}>
                                                    <Star className="mr-2 h-4 w-4"/>
                                                    {t('assignCeremony')}
                                                </Button>
                                                 <Button variant="outline" size="sm" onClick={() => setViewingUserCourses(u)}>
                                                    <Video className="mr-2 h-4 w-4" />
                                                    {t('viewCourses')}
                                                </Button>
                                                {u.preparationStep !== undefined && u.preparationStep > 0 || u.questionnaireCompleted ? (
                                                    <div className='flex flex-col gap-1'>
                                                        <Button variant="outline" size="sm" onClick={() => setViewingUserQuestionnaire(u)}>
                                                            <FileText className="mr-2 h-4 w-4"/>
                                                            {t('viewQuestionnaire')} {u.questionnaireCompleted ? '' : `(${getPreparationPercentage(u)}%)`}
                                                        </Button>
                                                        {!u.questionnaireCompleted && <Progress value={getPreparationPercentage(u)} className='h-1' />}
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => setInvitingUser(u)}>
                                                        <WhatsappIcon className="mr-2 h-4 w-4"/>
                                                        {t('invite')}
                                                    </Button>
                                                )}
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
                                        <Send className="mr-2 h-4 w-4" />
                                        {emailForm.formState.isSubmitting ? t('sending') : t('sendEmailButton')}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="invitation">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('invitationTabTitle')}</CardTitle>
                            <CardDescription>{t('invitationTabDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingMessages ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-40 w-full" />
                                    <Skeleton className="h-10 w-1/4" />
                                </div>
                            ) : (
                                <Form {...messagesForm}>
                                    <form onSubmit={messagesForm.handleSubmit(onMessagesSubmit)} className="space-y-6">
                                        <div className='space-y-4'>
                                        {templateFields.map((field, index) => (
                                            <Card key={field.id} className="p-4 bg-muted/30">
                                                 <FormField
                                                    control={messagesForm.control}
                                                    name={`templates.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className='mb-4'>
                                                            <FormLabel>{t('templateName')}</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={messagesForm.control}
                                                    name={`templates.${index}.es`}
                                                    render={({ field }) => (
                                                        <FormItem className='mb-2'>
                                                            <FormLabel>{t('templateMessageES')}</FormLabel>
                                                            <FormControl>
                                                                <Textarea {...field} rows={8}/>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={messagesForm.control}
                                                    name={`templates.${index}.en`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('templateMessageEN')}</FormLabel>
                                                            <FormControl>
                                                                <Textarea {...field} rows={8} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="button" variant="destructive" size="sm" className="mt-4" onClick={() => handleDeleteTemplate(field.id, index)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {t('deleteTemplate')}
                                                </Button>
                                            </Card>
                                        ))}
                                        </div>
                                        <div className='flex gap-2'>
                                            <Button type="button" variant="outline" onClick={handleAddTemplate}>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                {t('addTemplate')}
                                            </Button>
                                            <Button type="submit" disabled={messagesForm.formState.isSubmitting}>
                                                <Save className="mr-2 h-4 w-4"/>
                                                {messagesForm.formState.isSubmitting ? t('saving') : t('saveChanges')}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="analytics">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('analyticsTitle')}</CardTitle>
                            <CardDescription>{t('analyticsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingAnalytics ? (
                                <Skeleton className="h-64 w-full" />
                            ) : (
                                <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('sectionId')}</TableHead>
                                            <TableHead className='text-right'>{t('clickCount')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analytics.map((analytic) => (
                                            <TableRow key={analytic.sectionId}>
                                                <TableCell className="font-medium capitalize">{analytic.sectionId}</TableCell>
                                                <TableCell className="text-right">{analytic.clickCount}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {analytics.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">{t('noAnalyticsData')}</p>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="mt-6">
                                            <History className="mr-2 h-4 w-4" />
                                            {t('resetAnalytics')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('resetAnalyticsConfirmTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('resetAnalyticsConfirmDescription')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetAnalytics}>
                                                {t('continue')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {viewingUserQuestionnaire && (
                <QuestionnaireDialog 
                    user={viewingUserQuestionnaire} 
                    isOpen={!!viewingUserQuestionnaire} 
                    onClose={() => setViewingUserQuestionnaire(null)} 
                />
            )}
             {viewingUserCourses && (
                <ViewUserCoursesDialog
                    user={viewingUserCourses}
                    isOpen={!!viewingUserCourses}
                    onClose={() => setViewingUserCourses(null)}
                />
            )}
             {editingUser && (
                <EditProfileDialog 
                    user={editingUser} 
                    isAdminEditing={true}
                    isOpen={!!editingUser} 
                    onClose={() => setEditingUser(null)}
                    onAdminUpdate={handleProfileUpdate}
                />
            )}
             {assigningUser && (
                <AssignCeremonyDialog
                    user={assigningUser}
                    isOpen={!!assigningUser}
                    onClose={() => setAssigningUser(null)}
                    onUpdate={handleCeremonyAssignmentUpdate}
                />
            )}
             {invitingUser && (
                <Dialog open={!!invitingUser} onOpenChange={(open) => !open && setInvitingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('selectInvitationTemplate')}</DialogTitle>
                            <DialogDescription>{t('selectInvitationTemplateDescription', { name: invitingUser.displayName || invitingUser.email })}</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-80 my-4">
                            <div className="space-y-2 pr-6">
                                {invitationTemplates.map(template => (
                                    <button key={template.id} onClick={() => handleSendInvite(template)} className="w-full text-left p-3 rounded-md border hover:bg-muted">
                                        <p className="font-semibold">{template.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{template[i18n.language as 'es' | 'en'] || template.es}</p>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">{t('cancel')}</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
