

'use client';

import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageCircle, NotebookText, Trash2, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllChats, Chat, getUserProfile, getAllDreamEntries, DreamEntry, UserProfile, ChatMessage, deleteDreamEntry } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { es, enUS } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type DreamEntryWithUser = DreamEntry & { user: UserProfile };
type GroupedDreams = { [userId: string]: { user: UserProfile; dreams: DreamEntry[] } };

const DateSeparator = ({ date, locale }: { date: Date, locale: Locale }) => {
  let dateText: string;
  if (isToday(date)) {
    dateText = 'Hoy';
  } else if (isYesterday(date)) {
    dateText = 'Ayer';
  } else {
    dateText = format(date, 'PPP', { locale });
  }

  return (
    <div className="relative my-4 text-center">
      <Separator />
      <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted/20 px-2 text-xs text-muted-foreground">{dateText}</span>
    </div>
  );
};


export default function AdminInteractionHistoryPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const [dreamEntries, setDreamEntries] = useState<DreamEntryWithUser[]>([]);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const locale = i18n.language === 'es' ? es : enUS;

    const canViewFullDream = currentUser?.email === 'wilson2403@hotmail.com';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (!user) {
                router.push('/');
                return;
            }
            
            try {
                const profile = await getUserProfile(user.uid);
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

    const groupedMessagesByDate = (messages: ChatMessage[]) => {
        return messages.reduce((acc, message) => {
            const messageDate = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();
            const dateStr = format(messageDate, 'yyyy-MM-dd');
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(message);
            return acc;
        }, {} as Record<string, ChatMessage[]>);
    };
    
    const groupedDreamsByUser = useMemo(() => {
        return dreamEntries.reduce((acc, entry) => {
            const userId = entry.user.uid;
            if (!acc[userId]) {
                acc[userId] = { user: entry.user, dreams: [] };
            }
            acc[userId].dreams.push(entry);
            return acc;
        }, {} as GroupedDreams);
    }, [dreamEntries]);


    const handleDeleteDream = async (userId: string, dreamId: string) => {
        try {
            await deleteDreamEntry(userId, dreamId);
            setDreamEntries(prev => prev.filter(entry => entry.id !== dreamId));
            toast({ title: t('dreamDeletedSuccess') });
        } catch (error) {
            console.error("Failed to delete dream entry:", error);
            toast({ title: t('dreamDeletedError'), variant: 'destructive' });
        }
    }


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
                                {chats.map((chat) => {
                                    const groupedMessages = groupedMessagesByDate(chat.messages);
                                    return (
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
                                                         {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                                                            <div key={date}>
                                                                <DateSeparator date={parseISO(date)} locale={locale} />
                                                                {dayMessages.map((message, index) => (
                                                                    <div key={index} className={cn("flex items-start gap-3 mt-4", message.role === 'user' ? 'justify-start' : 'justify-end')}>
                                                                        {message.role === 'user' && (
                                                                            <Avatar className="h-6 w-6 flex-shrink-0">
                                                                                <AvatarImage src={chat.user?.photoURL || undefined} />
                                                                                <AvatarFallback>
                                                                                <UserIcon className="h-4 w-4" />
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
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
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
                                {Object.values(groupedDreamsByUser).map(({ user, dreams }) => (
                                    <AccordionItem key={user.uid} value={user.uid} className="border rounded-lg bg-muted/20 px-4">
                                        <AccordionTrigger className="w-full hover:no-underline">
                                            <div className='flex items-center gap-4'>
                                                <Avatar className='h-9 w-9'>
                                                    <AvatarImage src={user?.photoURL || undefined} />
                                                    <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className='flex-1 text-left'>
                                                    <p className="font-semibold truncate max-w-xs sm:max-w-md">{user?.displayName || user?.email || 'Anonymous'}</p>
                                                    <p className="text-sm text-muted-foreground">{t('dreamCount', { count: dreams.length })}</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-4 mt-2 border-t space-y-4">
                                                <Accordion type="single" collapsible className="w-full space-y-2">
                                                    {dreams.map((entry) => (
                                                        <AccordionItem key={entry.id} value={entry.id} className="border rounded-lg bg-background/50 px-4">
                                                            <div className="flex items-center w-full">
                                                                <AccordionTrigger className="w-full hover:no-underline text-sm font-semibold">
                                                                    {format(entry.date, 'PPP p', { locale })}
                                                                </AccordionTrigger>
                                                                {canViewFullDream && (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="destructive" size="icon" className='h-8 w-8 ml-2 flex-shrink-0'>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>{t('deleteDreamConfirmTitle')}</AlertDialogTitle>
                                                                                <AlertDialogDescription>{t('deleteDreamConfirmDescription')}</AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleDeleteDream(user.uid, entry.id)}>{t('delete')}</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </div>
                                                            <AccordionContent className="pt-2 mt-2 border-t space-y-2">
                                                                {canViewFullDream && (
                                                                    <>
                                                                        <div>
                                                                            <h4 className="font-semibold text-primary">{t('userDream')}</h4>
                                                                            <p className="text-sm text-muted-foreground italic mt-1">"{entry.dream}"</p>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-primary">{t('interpretation')}</h4>
                                                                            <p className="text-sm whitespace-pre-wrap mt-1">{entry.interpretation}</p>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {entry.recommendations?.personal && (
                                                                    <div>
                                                                        <h4 className="font-semibold text-primary">{t('recommendations')}</h4>
                                                                        <p className="text-sm whitespace-pre-wrap mt-1">{entry.recommendations.personal}</p>
                                                                    </div>
                                                                )}
                                                                {entry.recommendations?.lucidDreaming && entry.recommendations.lucidDreaming.length > 0 && (
                                                                    <div>
                                                                        <h4 className="font-semibold text-primary">{t('lucidDreamingTips')}</h4>
                                                                        <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                                                                            {entry.recommendations.lucidDreaming.map((tip, i) => (
                                                                                <li key={i}>{tip}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
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
