
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, ChevronRight, MessageSquare, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllChats, getUserProfile, Chat } from '@/lib/firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ADMIN_EMAIL = 'wilson2403@gmail.com';

export default function AdminChatPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const allChats = await getAllChats();
                allChats.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setChats(allChats);
            } catch (error) {
                console.error("Failed to fetch chats:", error);
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
            await fetchChats();
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast]);


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
                    <CardTitle>{t('allConversationsTitle')}</CardTitle>
                    <CardDescription>{t('allConversationsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {chats.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {chats.map(chat => (
                                <AccordionItem key={chat.id} value={chat.id}>
                                    <AccordionTrigger>
                                        <div className='flex items-center gap-4'>
                                           <MessageSquare className="h-5 w-5 text-primary" />
                                            <div className='text-left'>
                                                <p className="font-semibold">
                                                    {chat.user?.displayName || chat.user?.email || t('anonymousUser')}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {chat.createdAt ? format(chat.createdAt.toDate(), 'PPP p') : 'No date'}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ScrollArea className="h-72 w-full rounded-md border p-4">
                                            <div className="space-y-4">
                                                {chat.messages.map((message, index) => (
                                                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-start' : 'justify-end')}>
                                                        {message.role === 'user' && <User className="h-6 w-6 text-muted-foreground" />}
                                                        <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", message.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                        </div>
                                                        {message.role === 'model' && <Bot className="h-6 w-6 text-primary" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className='text-muted-foreground text-center'>{t('noConversationsFound')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
