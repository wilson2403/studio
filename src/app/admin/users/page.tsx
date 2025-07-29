

'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ShieldCheck, Users, FileText, CheckCircle, XCircle, Send, Edit, MessageSquare, Save, PlusCircle, Trash2, BarChart3, History, Star, Video, RotateCcw, Search, Bot, ClipboardList, SendHorizonal, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, getUserProfile, updateUserRole, UserProfile, updateUserStatus, getInvitationMessages, updateInvitationMessage, addInvitationMessage, deleteInvitationMessage, InvitationMessage, getSectionAnalytics, SectionAnalytics, UserStatus, UserRole, resetSectionAnalytics, resetQuestionnaire, deleteUser, getCourses, Course, updateUserPermissions, CeremonyInvitationMessage, getCeremonyInvitationMessages, addCeremonyInvitationMessage, updateCeremonyInvitationMessage, deleteCeremonyInvitationMessage, getShareMemoryMessages, addShareMemoryMessage, updateShareMemoryMessage, deleteShareMemoryMessage, ShareMemoryMessage, deleteAllAuditLogs } from '@/lib/firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { sendEmailToAllUsers } from '@/ai/flows/email-flow';
import TestimonialDialog from '@/components/admin/TestimonialDialog';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import EditProfileDialog from '@/components/auth/EditProfileDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AssignCeremonyDialog from '@/components/admin/AssignCeremonyDialog';
import ViewUserCoursesDialog from '@/components/admin/ViewUserCoursesDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import ViewUserChatsDialog from '@/components/admin/ViewUserChatsDialog';
import { Label } from '@/components/ui/label';
import ViewUserAuditLogDialog from '@/components/admin/ViewUserAuditLogDialog';
import InviteToCeremonyDialog from '@/components/admin/InviteToCeremonyDialog';
import ViewAnswersDialog from '@/components/questionnaire/ViewAnswersDialog';

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

const ceremonyMessageTemplateSchema = (t: (key: string, options?: any) => string) => z.object({
    id: z.string(),
    name: z.string().min(1, t('errorRequired', { field: t('templateName') })),
    es: z.string().min(1, t('errorRequired', { field: t('templateMessageES') })),
    en: z.string().min(1, t('errorRequired', { field: t('templateMessageEN') })),
});

const ceremonyMessagesFormSchema = (t: (key: string, options?: any) => string) => z.object({
    ceremonyTemplates: z.array(ceremonyMessageTemplateSchema(t)),
});

const shareMemoryMessageTemplateSchema = (t: (key: string, options?: any) => string) => z.object({
    id: z.string(),
    name: z.string().min(1, t('errorRequired', { field: t('templateName') })),
    es: z.string().min(1, t('errorRequired', { field: t('templateMessageES') })),
    en: z.string().min(1, t('errorRequired', { field: t('templateMessageEN') })),
});

const shareMemoryMessagesFormSchema = (t: (key: string, options?: any) => string) => z.object({
    shareMemoryTemplates: z.array(shareMemoryMessageTemplateSchema(t)),
});

type EmailFormValues = z.infer<ReturnType<typeof emailFormSchema>>;
type MessagesFormValues = z.infer<ReturnType<typeof messagesFormSchema>>;
type CeremonyMessagesFormValues = z.infer<ReturnType<typeof ceremonyMessagesFormSchema>>;
type ShareMemoryMessagesFormValues = z.infer<ReturnType<typeof shareMemoryMessagesFormSchema>>;

const userStatuses: UserStatus[] = ['Interesado', 'Cliente', 'Pendiente'];
const userRoles: UserRole[] = ['user', 'organizer', 'admin'];

const defaultInvitationMessage = (t: (key: string) => string): Omit<InvitationMessage, 'id'> => ({
    name: t('defaultInvitationName'),
    es: '¡Hola! Te invitamos a completar el cuestionario médico para continuar con tu proceso de reserva en El Arte de Sanar. Puedes hacerlo aquí: https://artedesanar.vercel.app/questionnaire',
    en: 'Hello! We invite you to complete the medical questionnaire to continue with your reservation process at El Arte de Sanar. You can do it here: https://artedesanar.vercel.app/questionnaire',
});

const defaultCeremonyInvitationMessage = (t: (key: string) => string): Omit<CeremonyInvitationMessage, 'id'> => ({
    name: t('defaultCeremonyInvitationName'),
    es: '¡Hola {{userName}}! Te confirmamos tu inscripción a la ceremonia "{{ceremonyTitle}}" del {{ceremonyDate}} a las {{ceremonyHorario}}. Aquí tienes el enlace con los detalles y la ubicación: {{ceremonyLink}}.\\n\\nUbicación: {{locationLink}}\\n\\n¡Te esperamos!',
    en: 'Hello {{userName}}! We are confirming your registration for the "{{ceremonyTitle}}" ceremony on {{ceremonyDate}} at {{ceremonyHorario}}. Here is the link with the details and location: {{ceremonyLink}}.\\n\\nLocation: {{locationLink}}\\n\\nWe look forward to seeing you!',
});

const defaultShareMemoryMessage = (t: (key: string) => string): Omit<ShareMemoryMessage, 'id'> => ({
    name: t('defaultShareMemoryName'),
    es: '¡Hola {{userName}}! ✨ Esperamos que te encuentres muy bien. Queríamos compartir contigo el recuerdo en video de la ceremonia "{{ceremonyTitle}}". ¡Fue un honor compartir ese espacio sagrado contigo!\\n\\nPuedes verlo aquí: {{memoryLink}}\\n\\nCon cariño,\\nEl equipo de El Arte de Sanar',
    en: 'Hello {{userName}}! ✨ We hope you are doing well. We wanted to share the video memory of the "{{ceremonyTitle}}" ceremony with you. It was an honor to share that sacred space with you!\\n\\nYou can watch it here: {{memoryLink}}\\n\\nWith love,\\nThe El Arte de Sanar Team',
});


export default function AdminUsersPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingUserQuestionnaire, setViewingUserQuestionnaire] = useState<UserProfile | null>(null);
    const [viewingUserChats, setViewingUserChats] = useState<UserProfile | null>(null);
    const [viewingUserAuditLog, setViewingUserAuditLog] = useState<UserProfile | null>(null);
    const [viewingUserCourses, setViewingUserCourses] = useState<UserProfile | null>(null);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [invitationTemplates, setInvitationTemplates] = useState<InvitationMessage[]>([]);
    const [ceremonyInvitationTemplates, setCeremonyInvitationTemplates] = useState<CeremonyInvitationMessage[]>([]);
    const [shareMemoryTemplates, setShareMemoryTemplates] = useState<ShareMemoryMessage[]>([]);
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

    const ceremonyMessagesForm = useForm<CeremonyMessagesFormValues>({
        resolver: zodResolver(ceremonyMessagesFormSchema(t)),
        defaultValues: { ceremonyTemplates: [] },
    });

    const { fields: ceremonyTemplateFields, append: appendCeremonyTemplate, remove: removeCeremonyTemplate } = useFieldArray({
        control: ceremonyMessagesForm.control,
        name: "ceremonyTemplates",
    });

    const shareMemoryMessagesForm = useForm<ShareMemoryMessagesFormValues>({
        resolver: zodResolver(shareMemoryMessagesFormSchema(t)),
        defaultValues: { shareMemoryTemplates: [] },
    });

    const { fields: shareMemoryTemplateFields, append: appendShareMemoryTemplate, remove: removeShareMemoryTemplate } = useFieldArray({
        control: shareMemoryMessagesForm.control,
        name: "shareMemoryTemplates",
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
            // Questionnaire Invites
            let templates = await getInvitationMessages();
            if(templates.length === 0) {
                const newId = uuidv4();
                const defaultTemplate = { id: newId, ...defaultInvitationMessage(t) };
                await addInvitationMessage(defaultTemplate);
                templates = [defaultTemplate];
            }
            setInvitationTemplates(templates);
            messagesForm.reset({ templates });

            // Ceremony Invites
            let ceremonyTemplates = await getCeremonyInvitationMessages();
            if(ceremonyTemplates.length === 0) {
                const newId = uuidv4();
                const defaultCeremonyTemplate = { id: newId, ...defaultCeremonyInvitationMessage(t) };
                await addCeremonyInvitationMessage(defaultCeremonyTemplate);
                ceremonyTemplates = [defaultCeremonyTemplate];
            }
            setCeremonyInvitationTemplates(ceremonyTemplates);
            ceremonyMessagesForm.reset({ ceremonyTemplates });

            // Share Memory Invites
            let memoryTemplates = await getShareMemoryMessages();
            if(memoryTemplates.length === 0) {
                const newId = uuidv4();
                const defaultMemoryTemplate = { id: newId, ...defaultShareMemoryMessage(t) };
                await addShareMemoryMessage(defaultMemoryTemplate);
                memoryTemplates = [defaultMemoryTemplate];
            }
            setShareMemoryTemplates(memoryTemplates);
            shareMemoryMessagesForm.reset({ shareMemoryTemplates: memoryTemplates });


            setLoadingMessages(false);
        };
        
        const fetchAnalytics = async () => {
            setLoadingAnalytics(true);
            const data = await getSectionAnalytics();
            setAnalytics(data);
            setLoadingAnalytics(false);
        };

        const fetchCourses = async () => {
            const allCourses = await getCourses();
            setCourses(allCourses);
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/'); return;
            }
            const profile = await getUserProfile(currentUser.uid);
            setCurrentUserProfile(profile);

            const isAuthorized = profile?.role === 'admin' || profile?.role === 'organizer';
            if (!isAuthorized) {
                router.push('/'); return;
            }

            setUser(currentUser);
            await Promise.all([fetchUsers(), fetchInvitationMessages(), fetchAnalytics(), fetchCourses()]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t, messagesForm, ceremonyMessagesForm, shareMemoryMessagesForm]);


    const handleRoleChange = async (uid: string, role: UserRole) => {
        try {
            await updateUserRole(uid, role);
            setUsers(users.map(u => u.uid === uid ? { ...u, role } : u));
            toast({ title: t('roleUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('roleUpdatedError'), variant: 'destructive' });
        }
    };
    
    const handlePermissionsChange = async (uid: string, permission: keyof NonNullable<UserProfile['permissions']>, value: boolean) => {
        try {
            await updateUserPermissions(uid, permission, value);
            setUsers(users.map(u => u.uid === uid ? { ...u, permissions: { ...(u.permissions || {}), [permission]: value } } : u));
            toast({ title: t('permissionsUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('permissionsUpdatedError'), variant: 'destructive' });
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
        if (!invitingUser || !invitingUser.phone) return;
        const lang = i18n.language as 'es' | 'en';
        const message = template?.[lang] || template?.es;
        const encodedMessage = encodeURIComponent(message);
        
        const phoneNumber = invitingUser.phone.replace(/\\D/g, '');
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
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

    const onCeremonyMessagesSubmit = async (data: CeremonyMessagesFormValues) => {
        try {
            for (const template of data.ceremonyTemplates) {
                await updateCeremonyInvitationMessage(template);
            }
            setCeremonyInvitationTemplates(data.ceremonyTemplates);
            toast({ title: t('messagesUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('messagesUpdatedError'), variant: 'destructive' });
        }
    };

    const handleAddCeremonyTemplate = async () => {
        const newTemplate: CeremonyInvitationMessage = {
            id: uuidv4(),
            name: t('newCeremonyTemplateName', { count: ceremonyTemplateFields.length + 1 }),
            es: t('defaultCeremonyInvitationName'),
            en: 'Default ceremony invitation message',
        }
        await addCeremonyInvitationMessage(newTemplate);
        appendCeremonyTemplate(newTemplate);
        setCeremonyInvitationTemplates(prev => [...prev, newTemplate]);
    }

    const handleDeleteCeremonyTemplate = async (templateId: string, index: number) => {
        try {
            await deleteCeremonyInvitationMessage(templateId);
            removeCeremonyTemplate(index);
            setCeremonyInvitationTemplates(prev => prev.filter(t => t.id !== templateId));
            toast({ title: t('templateDeleted') });
        } catch(error: any) {
             toast({ title: t('errorDeletingTemplate'), variant: 'destructive' });
        }
    }

    const onShareMemoryMessagesSubmit = async (data: ShareMemoryMessagesFormValues) => {
        try {
            for (const template of data.shareMemoryTemplates) {
                await updateShareMemoryMessage(template);
            }
            setShareMemoryTemplates(data.shareMemoryTemplates);
            toast({ title: t('messagesUpdatedSuccess') });
        } catch (error: any) {
            toast({ title: t('messagesUpdatedError'), variant: 'destructive' });
        }
    };

    const handleAddShareMemoryTemplate = async () => {
        const newTemplate: ShareMemoryMessage = {
            id: uuidv4(),
            name: t('newShareMemoryTemplateName', { count: shareMemoryTemplateFields.length + 1 }),
            es: t('defaultShareMemoryName'),
            en: 'Default share memory message',
        }
        await addShareMemoryMessage(newTemplate);
        appendShareMemoryTemplate(newTemplate);
        setShareMemoryTemplates(prev => [...prev, newTemplate]);
    }

    const handleDeleteShareMemoryTemplate = async (templateId: string, index: number) => {
        try {
            await deleteShareMemoryMessage(templateId);
            removeShareMemoryTemplate(index);
            setShareMemoryTemplates(prev => prev.filter(t => t.id !== templateId));
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

    const handleDeleteAuditLogs = async () => {
        try {
            await deleteAllAuditLogs();
            toast({ title: t('auditLogResetSuccess') });
        } catch (error: any) {
            toast({ title: t('auditLogResetError'), variant: 'destructive' });
        }
    }
    
    const handleResetQuestionnaire = async (uid: string) => {
        try {
            await resetQuestionnaire(uid);
            setUsers(users.map(u => u.uid === uid ? { ...u, questionnaireCompleted: false, preparationStep: 0 } : u));
            toast({ title: t('questionnaireResetSuccess') });
        } catch (error: any) {
            console.error('Failed to reset questionnaire:', error);
            toast({ title: t('questionnaireResetError'), description: (error as Error).message, variant: 'destructive' });
        }
    }

    const handleDeleteUser = async (uid: string) => {
        if (currentUserProfile?.uid === uid) {
            toast({ title: t('errorCannotDeleteSelf'), variant: 'destructive' });
            return;
        }
        try {
            await deleteUser(uid);
            setUsers(prev => prev.filter(u => u.uid !== uid));
            toast({ title: t('userDeletedSuccess') });
        } catch (error) {
             console.error('Failed to delete user:', error);
            toast({ title: t('userDeletedError'), description: (error as Error).message, variant: 'destructive' });
        }
    }

    const getPreparationPercentage = (user: UserProfile) => {
        if (user.questionnaireCompleted) return 100;
        const totalSteps = 12; // Increased to 12 because of the new info step
        const progress = user.preparationStep || 0;
        return Math.floor(((progress + 1) / totalSteps) * 100);
    }

    const getCourseProgressPercentage = (user: UserProfile) => {
        const requiredCourses = courses.filter(c => c.category === 'required');
        if (requiredCourses.length === 0) return 0;
        
        const completedCourses = user.completedCourses || [];
        const completedRequiredCount = requiredCourses.filter(rc => completedCourses.includes(rc.id)).length;
        
        return Math.floor((completedRequiredCount / requiredCourses.length) * 100);
    }
    
    const filteredUsers = users.filter(u => {
        const search = searchTerm.toLowerCase();
        return (
            u.displayName?.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.phone?.includes(search)
        );
    });

    const isSuperAdmin = currentUserProfile?.role === 'admin';
    const canEditUsers = isSuperAdmin || !!currentUserProfile?.permissions?.canEditUsers;
    const canViewChatHistory = isSuperAdmin || !!currentUserProfile?.permissions?.canViewChatHistory;


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
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />{t('userManagementTitle')}</TabsTrigger>
                    <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />{t('emailTab')}</TabsTrigger>
                    <TabsTrigger value="invitation"><MessageSquare className="mr-2 h-4 w-4"/>{t('invitationTabTitle')}</TabsTrigger>
                    <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/>{t('analyticsTab')}</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('allUsersTitle')}</CardTitle>
                            <CardDescription>{t('allUsersDescription')}</CardDescription>
                            <div className="relative pt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder={t('searchUserPlaceholder')}
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {filteredUsers.map((u) => (
                                    <AccordionItem key={u.uid} value={u.uid} className="border rounded-lg bg-muted/20 px-4">
                                        <AccordionTrigger className="w-full hover:no-underline">
                                            <div className="flex items-center gap-4 w-full">
                                                <Avatar>
                                                    <AvatarImage src={u.photoURL || undefined} alt={u.displayName} />
                                                    <AvatarFallback>{u.displayName?.charAt(0) || u.email.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 text-left">
                                                    <p className="font-semibold">{u.displayName || t('anonymousUser')}</p>
                                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <Badge variant={u.questionnaireCompleted ? 'success' : 'secondary'}>
                                                        {u.questionnaireCompleted ? (
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                        ) : (
                                                            <FileText className="mr-2 h-4 w-4" />
                                                        )}
                                                        {getPreparationPercentage(u)}%
                                                    </Badge>
                                                    {u.role === 'admin' && <Badge variant="destructive">{t('admin')}</Badge>}
                                                    {u.role === 'organizer' && <Badge variant="warning">{t('organizer')}</Badge>}
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold">{t('userStatus')}</h4>
                                                    {u.role === 'admin' ? (
                                                        <div className='flex items-center gap-2 font-semibold text-primary'>
                                                            <ShieldCheck className="h-4 w-4" />
                                                            {t('admin')}
                                                        </div>
                                                    ) : (
                                                        <Select
                                                            value={u.status || 'Interesado'}
                                                            onValueChange={(value) => handleStatusChange(u.uid, value as UserStatus)}
                                                            disabled={!canEditUsers}
                                                        >
                                                            <SelectTrigger className="w-full">
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
                                                </div>
                                                <div className="space-y-4">
                                                     <h4 className="font-semibold">{t('userRole')}</h4>
                                                     <Select
                                                        value={u.role || 'user'}
                                                        onValueChange={(value) => handleRoleChange(u.uid, value as UserRole)}
                                                        disabled={!isSuperAdmin}
                                                     >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder={t('selectRole')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {userRoles.map(role => (
                                                                <SelectItem key={role} value={role}>
                                                                    {t(`role_${role}`)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                     </Select>
                                                </div>

                                                {u.role === 'organizer' && (
                                                    <div className="md:col-span-2 space-y-4">
                                                        <h4 className="font-semibold">{t('permissions')}</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox id={`perm-ceremonies-${u.uid}`} checked={u.permissions?.canEditCeremonies} onCheckedChange={(checked) => handlePermissionsChange(u.uid, 'canEditCeremonies', !!checked)} disabled={!isSuperAdmin}/>
                                                                <Label htmlFor={`perm-ceremonies-${u.uid}`}>{t('permission_canEditCeremonies')}</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox id={`perm-courses-${u.uid}`} checked={u.permissions?.canEditCourses} onCheckedChange={(checked) => handlePermissionsChange(u.uid, 'canEditCourses', !!checked)} disabled={!isSuperAdmin}/>
                                                                <Label htmlFor={`perm-courses-${u.uid}`}>{t('permission_canEditCourses')}</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox id={`perm-users-${u.uid}`} checked={u.permissions?.canEditUsers} onCheckedChange={(checked) => handlePermissionsChange(u.uid, 'canEditUsers', !!checked)} disabled={!isSuperAdmin}/>
                                                                <Label htmlFor={`perm-users-${u.uid}`}>{t('permission_canEditUsers')}</Label>
                                                            </div>
                                                             <div className="flex items-center space-x-2">
                                                                <Checkbox id={`perm-chats-${u.uid}`} checked={u.permissions?.canViewChatHistory} onCheckedChange={(checked) => handlePermissionsChange(u.uid, 'canViewChatHistory', !!checked)} disabled={!isSuperAdmin}/>
                                                                <Label htmlFor={`perm-chats-${u.uid}`}>{t('permission_canViewChatHistory')}</Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                                                <Button variant="outline" size="sm" onClick={() => setEditingUser(u)} disabled={!canEditUsers}>
                                                    <Edit className="mr-2 h-4 w-4"/>{t('editUser')}
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setAssigningUser(u)}>
                                                    <Star className="mr-2 h-4 w-4"/>{t('assignCeremony')}
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setViewingUserCourses(u)}>
                                                    <Video className="mr-2 h-4 w-4" />{t('viewCourses')} ({getCourseProgressPercentage(u)}%)
                                                </Button>
                                                {u.phone && (
                                                    <Button variant="outline" size="sm" onClick={() => setInvitingUser(u)}>
                                                        <WhatsappIcon className="mr-2 h-4 w-4"/>{t('inviteQuestionnaireButton')}
                                                    </Button>
                                                )}
                                                {((u.preparationStep !== undefined && u.preparationStep > 0) || u.questionnaireCompleted) && (
                                                    <Button variant="outline" size="sm" onClick={() => setViewingUserQuestionnaire(u)}>
                                                        <FileText className="mr-2 h-4 w-4"/>{t('viewQuestionnaire')}
                                                    </Button>
                                                )}
                                                {u.hasChats && canViewChatHistory && (
                                                    <Button variant="outline" size="sm" onClick={() => setViewingUserChats(u)}>
                                                        <Bot className="mr-2 h-4 w-4"/>{t('viewAIChats')}
                                                    </Button>
                                                )}
                                                {u.hasLogs && (
                                                    <Button variant="outline" size="sm" onClick={() => setViewingUserAuditLog(u)}>
                                                        <ClipboardList className="mr-2 h-4 w-4"/>{t('viewAuditLog')}
                                                    </Button>
                                                )}
                                                {((u.preparationStep !== undefined && u.preparationStep > 0) || u.questionnaireCompleted) && (!u.assignedCeremonies || u.assignedCeremonies.length === 0) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <RotateCcw className="mr-2 h-4 w-4" /> {t('reset')}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>{t('resetQuestionnaireConfirmTitle')}</AlertDialogTitle>
                                                                <AlertDialogDescription>{t('resetQuestionnaireConfirmDescription', { name: u.displayName || u.email })}</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleResetQuestionnaire(u.uid)}>{t('continue')}</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                                {isSuperAdmin && u.role !== 'admin' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" className='h-9 w-9'>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>{t('deleteUserConfirmTitle')}</AlertDialogTitle>
                                                                <AlertDialogDescription>{t('deleteUserConfirmDescription', { name: u.displayName || u.email })}</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteUser(u.uid)}>{t('delete')}</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
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
                                <Accordion type="multiple" defaultValue={['questionnaire-templates']}>
                                    <AccordionItem value="questionnaire-templates">
                                        <AccordionTrigger>{t('questionnaireInvitationTemplates')}</AccordionTrigger>
                                        <AccordionContent>
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
                                                                            <Textarea {...field} rows={5}/>
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
                                                                            <Textarea {...field} rows={5} />
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
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="ceremony-templates">
                                        <AccordionTrigger>{t('ceremonyInvitationTemplates')}</AccordionTrigger>
                                        <AccordionContent>
                                            <Form {...ceremonyMessagesForm}>
                                                <form onSubmit={ceremonyMessagesForm.handleSubmit(onCeremonyMessagesSubmit)} className="space-y-6">
                                                    <div className='space-y-4'>
                                                    {ceremonyTemplateFields.map((field, index) => (
                                                        <Card key={field.id} className="p-4 bg-muted/30">
                                                            <FormField
                                                                control={ceremonyMessagesForm.control}
                                                                name={`ceremonyTemplates.${index}.name`}
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
                                                                control={ceremonyMessagesForm.control}
                                                                name={`ceremonyTemplates.${index}.es`}
                                                                render={({ field }) => (
                                                                    <FormItem className='mb-2'>
                                                                        <FormLabel>{t('templateMessageES')}</FormLabel>
                                                                        <FormControl>
                                                                            <Textarea {...field} rows={10}/>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={ceremonyMessagesForm.control}
                                                                name={`ceremonyTemplates.${index}.en`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>{t('templateMessageEN')}</FormLabel>
                                                                        <FormControl>
                                                                            <Textarea {...field} rows={10} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                             <p className="text-xs text-muted-foreground mt-2">{t('placeholdersInfo')}</p>
                                                            <Button type="button" variant="destructive" size="sm" className="mt-4" onClick={() => handleDeleteCeremonyTemplate(field.id, index)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t('deleteTemplate')}
                                                            </Button>
                                                        </Card>
                                                    ))}
                                                    </div>
                                                    <div className='flex gap-2'>
                                                        <Button type="button" variant="outline" onClick={handleAddCeremonyTemplate}>
                                                            <PlusCircle className="mr-2 h-4 w-4" />
                                                            {t('addCeremonyTemplate')}
                                                        </Button>
                                                        <Button type="submit" disabled={ceremonyMessagesForm.formState.isSubmitting}>
                                                            <Save className="mr-2 h-4 w-4"/>
                                                            {ceremonyMessagesForm.formState.isSubmitting ? t('saving') : t('saveChanges')}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Form>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="share-memory-templates">
                                        <AccordionTrigger>{t('shareMemoryTemplates')}</AccordionTrigger>
                                        <AccordionContent>
                                            <Form {...shareMemoryMessagesForm}>
                                                <form onSubmit={shareMemoryMessagesForm.handleSubmit(onShareMemoryMessagesSubmit)} className="space-y-6">
                                                    <div className='space-y-4'>
                                                    {shareMemoryTemplateFields.map((field, index) => (
                                                        <Card key={field.id} className="p-4 bg-muted/30">
                                                            <FormField
                                                                control={shareMemoryMessagesForm.control}
                                                                name={`shareMemoryTemplates.${index}.name`}
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
                                                                control={shareMemoryMessagesForm.control}
                                                                name={`shareMemoryTemplates.${index}.es`}
                                                                render={({ field }) => (
                                                                    <FormItem className='mb-2'>
                                                                        <FormLabel>{t('templateMessageES')}</FormLabel>
                                                                        <FormControl>
                                                                            <Textarea {...field} rows={10}/>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={shareMemoryMessagesForm.control}
                                                                name={`shareMemoryTemplates.${index}.en`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>{t('templateMessageEN')}</FormLabel>
                                                                        <FormControl>
                                                                            <Textarea {...field} rows={10} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                             <p className="text-xs text-muted-foreground mt-2">{t('shareMemoryPlaceholdersInfo')}</p>
                                                            <Button type="button" variant="destructive" size="sm" className="mt-4" onClick={() => handleDeleteShareMemoryTemplate(field.id, index)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t('deleteTemplate')}
                                                            </Button>
                                                        </Card>
                                                    ))}
                                                    </div>
                                                    <div className='flex gap-2'>
                                                        <Button type="button" variant="outline" onClick={handleAddShareMemoryTemplate}>
                                                            <PlusCircle className="mr-2 h-4 w-4" />
                                                            {t('addShareMemoryTemplate')}
                                                        </Button>
                                                        <Button type="submit" disabled={shareMemoryMessagesForm.formState.isSubmitting}>
                                                            <Save className="mr-2 h-4 w-4"/>
                                                            {shareMemoryMessagesForm.formState.isSubmitting ? t('saving') : t('saveChanges')}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Form>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
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
                                <div className='overflow-x-auto'>
                                    <table className='w-full'>
                                        <thead>
                                            <tr className='border-b'>
                                                <th className='p-2 text-left'>{t('sectionId')}</th>
                                                <th className='p-2 text-right'>{t('clickCount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.map((analytic) => (
                                                <tr key={analytic.sectionId} className='border-b'>
                                                    <td className="p-2 font-medium capitalize">{analytic.sectionId}</td>
                                                    <td className="p-2 text-right">{analytic.clickCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {analytics.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">{t('noAnalyticsData')}</p>
                                )}
                                <div className='flex flex-wrap gap-2 mt-6'>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" >
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
                                    {isSuperAdmin && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {t('deleteAllAuditLogs')}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('deleteAllAuditLogsConfirmTitle')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('deleteAllAuditLogsConfirmDescription')}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteAuditLogs}>
                                                        {t('continue')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {viewingUserQuestionnaire && (
                <ViewAnswersDialog
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
            {viewingUserChats && (
                <ViewUserChatsDialog
                    user={viewingUserChats}
                    isOpen={!!viewingUserChats}
                    onClose={() => setViewingUserChats(null)}
                />
            )}
            {viewingUserAuditLog && (
                <ViewUserAuditLogDialog
                    user={viewingUserAuditLog}
                    isOpen={!!viewingUserAuditLog}
                    onClose={() => setViewingUserAuditLog(null)}
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
                    invitationTemplates={ceremonyInvitationTemplates}
                    shareMemoryTemplates={shareMemoryTemplates}
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

    

