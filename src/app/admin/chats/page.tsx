

'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageCircle, NotebookText, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllChats, Chat, getUserProfile, getAllDreamEntries, DreamEntry, UserProfile } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { es, enUS } from 'date-fns/locale';

type DreamEntryWithUser = DreamEntry & { user: UserProfile };

export default function AdminInteractionHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const [dreamEntries, setDreamEntries] = useState<DreamEntryWithUser[]>([]);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const locale = i18n.language === 'es' ? es : enUS;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/');
                return;
            }
            
            try {
                const profile = await getUserProfile(currentUser.uid);
                const hasPermission = profile?.role === 'admin' || (profile?.role === 'organizer' && profile?.permissions?.canViewChatHistory);

                if (!hasPermission) {
                    router.push('/');
                } else {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [router]);
    
    useEffect(() => {
        if (!isAuthorized) return;

        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [allChats, allDreamEntries] = await Promise.all([
                    getAllChats(),
                    getAllDreamEntries()
                ]);
                setChats(allChats);
                setDreamEntries(allDreamEntries);
            } catch (error) {
                console.error("Failed to fetch interaction history:", error);
                toast({ title: t('errorFetchChats'), variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
        
    }, [isAuthorized, toast, t]);


    if (!isAuthorized || loading) {
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
                    {t('interactionHistoryTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('interactionHistorySubtitle')}</p>
            </div>
            
             <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="conversations">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {t('conversationsTab')}
                    </TabsTrigger>
                    <TabsTrigger value="dreams">
                        <NotebookText className="mr-2 h-4 w-4" />
                        {t('dreamsTab')}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="conversations">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('allConversations')}</CardTitle>
                            <CardDescription>{t('allConversationsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {chats.map((chat) => (
                                    <AccordionItem key={chat.id} value={chat.id} className="border rounded-lg bg-muted/20 px-4">
                                        <AccordionTrigger className="w-full hover:no-underline">
                                            <div className="flex items-center justify-between gap-4 w-full">
                                                <div className='flex items-center gap-4'>
                                                    <Avatar className='h-9 w-9'>
                                                        <AvatarImage src={chat.user?.photoURL || undefined} />
                                                        <AvatarFallback>{chat.user?.displayName?.charAt(0) || chat.user?.email?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className='flex-1 text-left'>
                                                        <p className="font-semibold truncate max-w-xs sm:max-w-md">{chat.user?.displayName || chat.user?.email || 'Anonymous'}</p>
                                                        <p className="text-sm text-muted-foreground">{chat.updatedAt ? format(chat.updatedAt, 'PPP p', { locale }) : ''}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <ScrollArea className="h-72 w-full rounded-md border p-4 mt-2">
                                                <div className="space-y-4">
                                                    {chat.messages.map((message, index) => (
                                                        <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-start' : 'justify-end')}>
                                                            {message.role === 'user' && (
                                                                <Avatar className="h-6 w-6 flex-shrink-0">
                                                                    <AvatarImage src={chat.user?.photoURL || undefined} />
                                                                    <AvatarFallback>
                                                                    <User className="h-4 w-4" />
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            )}
                                                            <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", message.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                            </div>
                                                            {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                            {chats.length === 0 && (
                                <p className='text-center text-muted-foreground py-8'>{t('noConversationsFound')}</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="dreams">
                     <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{t('allDreamEntries')}</CardTitle>
                            <CardDescription>{t('allDreamEntriesDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {dreamEntries.map((entry) => (
                                    <AccordionItem key={entry.id} value={entry.id} className="border rounded-lg bg-muted/20 px-4">
                                        <AccordionTrigger className="w-full hover:no-underline">
                                            <div className="flex items-center justify-between gap-4 w-full">
                                                <div className='flex items-center gap-4'>
                                                    <Avatar className='h-9 w-9'>
                                                        <AvatarImage src={entry.user?.photoURL || undefined} />
                                                        <AvatarFallback>{entry.user?.displayName?.charAt(0) || entry.user?.email?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className='flex-1 text-left'>
                                                        <p className="font-semibold truncate max-w-xs sm:max-w-md">{entry.user?.displayName || entry.user?.email || 'Anonymous'}</p>
                                                        <p className="text-sm text-muted-foreground">{format(entry.date, 'PPP p', { locale })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-4 mt-2 border-t space-y-4">
                                                <div>
                                                    <h4 className="font-semibold text-primary">{t('userDream')}</h4>
                                                    <p className="text-sm text-muted-foreground italic mt-1">"{entry.dream}"</p>
                                                </div>
                                                 <div>
                                                    <h4 className="font-semibold text-primary">{t('interpretation')}</h4>
                                                    <p className="text-sm whitespace-pre-wrap mt-1">{entry.interpretation}</p>
                                                </div>
                                                {entry.recommendations?.personal && (
                                                    <div>
                                                        <h4 className="font-semibold text-primary">{t('recommendations')}</h4>
                                                        <p className="text-sm whitespace-pre-wrap mt-1">{entry.recommendations.personal}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                            {dreamEntries.length === 0 && (
                                <p className='text-center text-muted-foreground py-8'>{t('noDreamEntriesAdmin')}</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
