
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllChats, Chat, getUserProfile } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminChatHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const allChats = await getAllChats();
                setChats(allChats);
            } catch (error) {
                console.error("Failed to fetch chats:", error);
                toast({ title: t('errorFetchChats'), variant: 'destructive' });
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/');
                return;
            }
            
            const profile = await getUserProfile(currentUser.uid);
            const isAuthorized = profile?.role === 'admin' || (profile?.role === 'organizer' && profile?.permissions?.canViewChatHistory);

            if (!isAuthorized) {
                router.push('/');
                return;
            }
            
            await fetchChats();
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t]);


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
                    {t('chatHistoryTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('chatHistorySubtitle')}</p>
            </div>
            
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
                                                <p className="text-sm text-muted-foreground">{format(chat.updatedAt.toDate(), 'PPP p')}</p>
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
                     {chats.length === 0 && !loading && (
                        <p className='text-center text-muted-foreground py-8'>{t('noConversationsFound')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
