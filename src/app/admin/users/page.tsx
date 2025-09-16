

'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ShieldCheck, Users, FileText, CheckCircle, XCircle, Send, Edit, MessageSquare, Save, PlusCircle, Trash2, BarChart3, History, Star, Video, RotateCcw, Search, Bot, ClipboardList, SendHorizonal, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, getUserProfile, updateUserRole, UserProfile, updateUserStatus, getInvitationMessages, updateInvitationMessage, addInvitationMessage, deleteInvitationMessage, InvitationMessage, getSectionAnalytics, SectionAnalytics, UserStatus, UserRole, resetSectionAnalytics, resetQuestionnaire, deleteUser, getCourses, Course, updateUserPermissions, CeremonyInvitationMessage, getCeremonyInvitationMessages, addCeremonyInvitationMessage, updateCeremonyInvitationMessage, deleteCeremonyInvitationMessage, getShareMemoryMessages, addShareMemoryMessage, updateShareMemoryMessage, deleteShareMemoryMessage, ShareMemoryMessage, deleteAllAuditLogs, getCeremonies, Ceremony } from '@/lib/firebase/firestore';
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
import { sendBulkEmail } from '@/ai/flows/email-flow';
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
import { EditableTitle } from '@/components/home/EditableTitle';
import { cn } from '@/lib/utils';
import EditTemplateDialog from '@/components/admin/EditTemplateDialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const emailFormSchema = (t: (key: string) => string) => z.object({
    subject: z.string().min(1, t('errorRequired', { field: t('emailSubject') })),
    body: z.string().min(1, t('errorRequired', { field: t('emailBody') })),
    recipients: z.array(z.string()).min(1, t('errorSelectRecipients')),
});

type EmailFormValues = z.infer<ReturnType<typeof emailFormSchema>>;
type TemplateType = 'invitation' | 'ceremony' | 'share-memory';
type CombinedTemplate = (InvitationMessage | CeremonyInvitationMessage | ShareMemoryMessage) & { type: TemplateType };

const userStatuses: UserStatus[] = ['Interesado', 'Cliente', 'Pendiente'];
const userRoles: UserRole[] = ['user', 'organizer', 'admin'];

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
    const [invitingUser, setInvitingUser] = useState<UserProfile | null>(null);
    const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
    
    const [allTemplates, setAllTemplates] = useState<CombinedTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<CombinedTemplate | null>(null);
    const [originalEditingTemplate, setOriginalEditingTemplate] = useState<CombinedTemplate | null>(null);
    const [loadingMessages, setLoadingMessages] = useState(true);
    
    const [analytics, setAnalytics] = useState<SectionAnalytics[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [emailBodyLanguage, setEmailBodyLanguage] = useState<'es' | 'en'>('es');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const [activeCeremonies, setActiveCeremonies] = useState<Ceremony[]>([]);
    const [selectingCeremonyForInvite, setSelectingCeremonyForInvite] = useState<{ user: UserProfile; template: CombinedTemplate } | null>(null);

    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { toast } = useToast();

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailFormSchema(t)),
        defaultValues: { subject: '', body: '', recipients: [] },
    });

    const fetchAllMessages = async () => {
        setLoadingMessages(true);
        try {
            const [invites, ceremonyInvites, memoryShares] = await Promise.all([
                getInvitationMessages(),
                getCeremonyInvitationMessages(),
                getShareMemoryMessages(),
            ]);

            const formattedInvites: CombinedTemplate[] = invites.map(t => ({...t, type: 'invitation' as const}));
            const formattedCeremony: CombinedTemplate[] = ceremonyInvites.map(t => ({...t, type: 'ceremony' as const}));
            const formattedMemory: CombinedTemplate[] = memoryShares.map(t => ({...t, type: 'share-memory' as const}));
            
            const combined = [...formattedInvites, ...formattedCeremony, ...formattedMemory];
            combined.sort((a,b) => a.name.localeCompare(b.name));

            setAllTemplates(combined);
        } catch (e) {
             toast({ title: "Error", description: "Failed to load message templates.", variant: "destructive" });
        } finally {
            setLoadingMessages(false);
        }
    };


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
            await Promise.all([fetchUsers(), fetchAllMessages(), fetchAnalytics(), fetchCourses()]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t]);


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

    const handleSendInvite = async (template: CombinedTemplate, lang: 'es' | 'en') => {
        if (!invitingUser || !invitingUser.phone) return;
        
        let message = template?.[lang as keyof typeof template] as string || template?.es;
        
        if (template.name === 'Invitar al Intérprete de Sueños') {
            const dreamInterpreterLink = `${window.location.origin}/interpreter`;
            message = message.replace('{{dreamInterpreterLink}}', dreamInterpreterLink);
        } else if (template.type === 'invitation' && message.includes('{{activeCeremoniesList}}')) {
            const active = await getCeremonies('active');
            const ceremoniesList = active.map(c => `✨ ${c.title}`).join('\n');
            const pageLink = `${window.location.origin}/ceremonies`;
            message = message.replace('{{activeCeremoniesList}}', ceremoniesList)
                             .replace('{{pageLink}}', pageLink);
        } else if (template.type === 'ceremony') {
            const active = await getCeremonies('active');
            setActiveCeremonies(active);
            setSelectingCeremonyForInvite({ user: invitingUser, template });
            return; // Exit here, the rest will be handled by the ceremony selection dialog
        }
        
        const phoneNumber = invitingUser.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(url, '_blank');
        setInvitingUser(null);
    }
    
    const handleSendCeremonyInvite = (ceremony: Ceremony) => {
        if (!selectingCeremonyForInvite) return;
        
        const { user: userToInvite, template } = selectingCeremonyForInvite;
        const lang = i18n.language as 'es' | 'en';
        let message = (template as CeremonyInvitationMessage)[lang] || (template as CeremonyInvitationMessage).es;

        const ceremonyLink = `${window.location.origin}/ceremonias/${ceremony.slug || ceremony.id}`;

        message = message.replace(/{{userName}}/g, userToInvite.displayName || 'participante');
        message = message.replace(/{{ceremonyTitle}}/g, ceremony.title || '');
        message = message.replace(/{{ceremonyDate}}/g, ceremony.date || '');
        message = message.replace(/{{ceremonyHorario}}/g, ceremony.horario || '');
        message = message.replace(/{{ceremonyLink}}/g, ceremonyLink);
        message = message.replace(/{{locationLink}}/g, ceremony.locationLink || '');
        
        const phoneNumber = userToInvite.phone!.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        window.open(url, '_blank');
        toast({ title: t('invitationSent') });
        setSelectingCeremonyForInvite(null);
    }


    const onEmailSubmit = async (data: EmailFormValues) => {
        try {
            emailForm.control.disabled = true;
            const result = await sendBulkEmail({ emails: data.recipients, subject: data.subject, body: data.body });
            if (result.success) {
                toast({ title: t('emailsSentSuccess'), description: result.message });
                emailForm.reset();
                setSelectedTemplateId(null);
            } else {
                 toast({ title: t('emailsSentError'), description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
             toast({ title: t('emailsSentError'), description: error.message, variant: 'destructive' });
        } finally {
             emailForm.control.disabled = false;
        }
    };
    
    const handleAddTemplate = async (type: TemplateType) => {
        let name = '';
        let es = '';
        let en = '';
        
        if (type === 'invitation') {
            name = t('newTemplateName', { count: allTemplates.filter(t => t.type === 'invitation').length + 1 });
            es = t('newTemplateMessageES');
            en = t('newTemplateMessageEN');
            const newId = await addInvitationMessage({ name, es, en });
            const newTemplate = { id: newId, name, es, en, type };
            setEditingTemplate(newTemplate);
            setOriginalEditingTemplate(newTemplate);
        } else if (type === 'ceremony') {
            name = t('newCeremonyTemplateName', { count: allTemplates.filter(t => t.type === 'ceremony').length + 1 });
            es = t('defaultCeremonyInvitationTextES');
            en = t('defaultCeremonyInvitationTextEN');
            const newId = await addCeremonyInvitationMessage({ name, es, en });
            const newTemplate = { id: newId, name, es, en, type };
            setEditingTemplate(newTemplate);
            setOriginalEditingTemplate(newTemplate);
        } else {
            name = t('newShareMemoryTemplateName', { count: allTemplates.filter(t => t.type === 'share-memory').length + 1 });
            es = t('defaultShareMemoryTextES');
            en = t('defaultShareMemoryTextEN');
            const newId = await addShareMemoryMessage({ name, es, en });
            const newTemplate = { id: newId, name, es, en, type };
            setEditingTemplate(newTemplate);
            setOriginalEditingTemplate(newTemplate);
        }
        await fetchAllMessages();
    };


    const handleSaveTemplate = async (originalTemplate: CombinedTemplate, updatedTemplate: CombinedTemplate) => {
        try {
            const { type: newType, ...dataToSave } = updatedTemplate;
            const oldType = originalTemplate.type;

            if (newType !== oldType) {
                // Delete from old collection
                if (oldType === 'invitation') await deleteInvitationMessage(originalTemplate.id);
                else if (oldType === 'ceremony') await deleteCeremonyInvitationMessage(originalTemplate.id);
                else if (oldType === 'share-memory') await deleteShareMemoryMessage(originalTemplate.id);
                
                // Add to new collection
                if (newType === 'invitation') await addInvitationMessage(dataToSave as Omit<InvitationMessage, 'id'>);
                else if (newType === 'ceremony') await addCeremonyInvitationMessage(dataToSave as Omit<CeremonyInvitationMessage, 'id'>);
                else if (newType === 'share-memory') await addShareMemoryMessage(dataToSave as Omit<ShareMemoryMessage, 'id'>);

            } else {
                 // Update in the same collection
                if (newType === 'invitation') await updateInvitationMessage(dataToSave as InvitationMessage);
                else if (newType === 'ceremony') await updateCeremonyInvitationMessage(dataToSave as CeremonyInvitationMessage);
                else if (newType === 'share-memory') await updateShareMemoryMessage(dataToSave as ShareMemoryMessage);
            }
            toast({ title: t('messagesUpdatedSuccess') });
            await fetchAllMessages(); // Re-fetch to update list
        } catch (error: any) {
            toast({ title: t('messagesUpdatedError'), variant: 'destructive' });
        }
    };
    
    const handleDeleteTemplate = async (template: CombinedTemplate) => {
        try {
            if (template.type === 'invitation') {
                await deleteInvitationMessage(template.id);
            } else if (template.type === 'ceremony') {
                await deleteCeremonyInvitationMessage(template.id);
            } else if (template.type === 'share-memory') {
                await deleteShareMemoryMessage(template.id);
            }
            toast({ title: t('templateDeleted') });
            await fetchAllMessages(); // Re-fetch to update list
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
        return Math.round(((progress + 1) / totalSteps) * 100);
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
            (u.displayName && u.displayName.toLowerCase().includes(search)) ||
            (u.email && u.email.toLowerCase().includes(search)) ||
            (u.phone && u.phone.includes(search))
        );
    });

    const isSuperAdmin = currentUserProfile?.role === 'admin';
    const canEditUsers = isSuperAdmin || !!currentUserProfile?.permissions?.canEditUsers;
    const canViewChatHistory = isSuperAdmin || !!currentUserProfile?.permissions?.canViewChatHistory;
    
    const handleTemplateChange = (templateId: string) => {
        const template = allTemplates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplateId(templateId);
            emailForm.setValue('body', template[emailBodyLanguage as keyof typeof template] as string);
        }
    };
    
    const handleLanguageChange = (lang: 'es' | 'en') => {
        setEmailBodyLanguage(lang);
        if (selectedTemplateId) {
            const template = allTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                emailForm.setValue('body', template[lang as keyof typeof template] as string);
            }
        }
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
        <>
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
                                                {isSuperAdmin && currentUserProfile?.uid !== u.uid && (
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
                                     <div className="space-y-2">
                                        <Label>{t('selectTemplate')}</Label>
                                        <Select onValueChange={handleTemplateChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectTemplatePlaceholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allTemplates.map(template => (
                                                    <SelectItem key={template.id} value={template.id}>
                                                        {template.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                     </div>
                                      <div className="space-y-2">
                                        <Label>{t('language')}</Label>
                                        <div className="flex gap-2">
                                            <Button type="button" variant={emailBodyLanguage === 'es' ? 'default' : 'outline'} onClick={() => handleLanguageChange('es')}>{t('spanish')}</Button>
                                            <Button type="button" variant={emailBodyLanguage === 'en' ? 'default' : 'outline'} onClick={() => handleLanguageChange('en')}>{t('english')}</Button>
                                        </div>
                                     </div>
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
                                    <div className="space-y-4">
                                        <Label>{t('selectUsers')}</Label>
                                         <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="select-all-users"
                                                onCheckedChange={(checked) => {
                                                    const allEmails = checked ? users.map(u => u.email).filter((e): e is string => !!e) : [];
                                                    emailForm.setValue('recipients', allEmails);
                                                }}
                                                checked={emailForm.watch('recipients')?.length === users.length && users.length > 0}
                                            />
                                            <Label htmlFor="select-all-users">{t('selectAll')}</Label>
                                        </div>
                                        <ScrollArea className="h-60 rounded-md border p-4">
                                            <FormField
                                                control={emailForm.control}
                                                name="recipients"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        {users.map((u) => u.email && (
                                                            <FormField
                                                                key={u.uid}
                                                                control={emailForm.control}
                                                                name="recipients"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(u.email!)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...field.value, u.email!])
                                                                                        : field.onChange(field.value?.filter((value) => value !== u.email))
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal w-full">
                                                                            <div className='flex justify-between w-full'>
                                                                                <span>{u.displayName}</span>
                                                                                <span className='text-muted-foreground text-xs'>{u.email}</span>
                                                                            </div>
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </ScrollArea>
                                    </div>
                                    <Button type="submit" disabled={emailForm.formState.isSubmitting || emailForm.watch('recipients').length === 0}>
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
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />{t('addTemplate')}</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleAddTemplate('invitation')}>{t('questionnaireInvitationTemplates')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAddTemplate('ceremony')}>{t('ceremonyInvitationTemplates')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAddTemplate('share-memory')}>{t('shareMemoryTemplates')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <div className="space-y-2">
                                        {allTemplates.map((template) => (
                                            <div key={template.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <p className='font-semibold'>{template.name}</p>
                                                    <p className='text-xs text-muted-foreground'>({t(`templateType_${template.type}`)})</p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(template); setOriginalEditingTemplate(template); }}><Edit className="mr-2 h-4 w-4" />{t('edit')}</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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

            {editingTemplate && (
                <EditTemplateDialog
                    isOpen={!!editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    template={editingTemplate}
                    originalTemplate={originalEditingTemplate}
                    onSave={handleSaveTemplate}
                    onDelete={handleDeleteTemplate}
                />
            )}

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
                    invitationTemplates={(allTemplates.filter(t => t.type === 'ceremony') as unknown as CeremonyInvitationMessage[])}
                    shareMemoryTemplates={(allTemplates.filter(t => t.type === 'share-memory') as unknown as ShareMemoryMessage[])}
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
                            <div className="space-y-4 pr-6">
                                {allTemplates.filter(t => t.type === 'invitation' || t.type === 'ceremony').map(template => (
                                    <div key={template.id} className="p-3 rounded-md border">
                                        <p className="font-semibold mb-2">{template.name} <span className='text-xs text-muted-foreground'>({t(`templateType_${template.type}`)})</span></p>
                                        <div className='flex flex-col sm:flex-row gap-2'>
                                            <Button size="sm" className='flex-1' onClick={() => handleSendInvite(template, 'es')}>
                                                {t('sendInSpanish')}
                                            </Button>
                                            <Button size="sm" className='flex-1' onClick={() => handleSendInvite(template, 'en')}>
                                                {t('sendInEnglish')}
                                            </Button>
                                        </div>
                                    </div>
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

            {selectingCeremonyForInvite && (
                 <Dialog open={!!selectingCeremonyForInvite} onOpenChange={(open) => !open && setSelectingCeremonyForInvite(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('selectActiveCeremony')}</DialogTitle>
                            <DialogDescription>{t('selectActiveCeremonyDesc', { name: selectingCeremonyForInvite.user.displayName })}</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-80 my-4">
                            <div className="space-y-2 pr-4">
                                {activeCeremonies.map(ceremony => (
                                    <Button key={ceremony.id} variant="outline" className="w-full justify-start" onClick={() => handleSendCeremonyInvite(ceremony)}>
                                        {ceremony.title}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                 </Dialog>
            )}
        </div>
        </>
    );
}

    

    




