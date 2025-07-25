
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getChatsByUserId, Chat } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { continueChat, ChatMessage } from '@/ai/flows/chat-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function MyChatsPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userChats = await getChatsByUserId(currentUser.uid);
                    setChats(userChats);
                } catch (error) {
                    console.error("Failed to fetch chats:", error);
                    toast({ title: t('errorFetchChats'), variant: 'destructive' });
                }
            } else {
                router.push('/login?redirect=/chats');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast, t]);

    const handleContinueChat = (chat: Chat) => {
        setSelectedChat(chat);
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !selectedChat || !user) return;

        const newUserMessage: ChatMessage = { role: 'user', content: chatInput };
        
        // Update local state immediately for better UX
        const updatedChat = { ...selectedChat, messages: [...selectedChat.messages, newUserMessage] };
        setSelectedChat(updatedChat);
        setChats(chats.map(c => c.id === selectedChat.id ? updatedChat : c));

        const question = chatInput;
        setChatInput('');
        setIsSending(true);

        try {
            const response = await continueChat({
                chatId: selectedChat.id,
                question: question,
                user: { uid: user.uid, email: user.email, displayName: user.displayName }
            });

            if (response.answer) {
                const newModelMessage: ChatMessage = { role: 'model', content: response.answer };
                const finalChat = { ...updatedChat, messages: [...updatedChat.messages, newModelMessage] };
                setSelectedChat(finalChat);
                setChats(chats.map(c => c.id === selectedChat.id ? finalChat : c));
            }
        } catch (error) {
            toast({ title: t('chatbotError'), variant: 'destructive' });
            // Revert the user message if sending fails
            setSelectedChat(selectedChat);
            setChats(chats.map(c => c.id === selectedChat.id ? selectedChat : c));
        } finally {
            setIsSending(false);
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
        <div className="container py-12 md:py-16 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-headline bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
                    {t('myChatsTitle')}
                </h1>
                <p className="mt-2 text-lg text-foreground/80 font-body">{t('myChatsSubtitle')}</p>
            </div>
            
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t('myConversations')}</CardTitle>
                    <CardDescription>{t('myConversationsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedChat ? (
                        <div className="flex flex-col h-[60vh]">
                            <Button variant="ghost" onClick={() => setSelectedChat(null)} className='self-start mb-4'>&larr; {t('backToHistory')}</Button>
                            <ScrollArea className="flex-1 border rounded-md p-4 mb-4">
                               <div className="space-y-4">
                                    {selectedChat.messages.map((message, index) => (
                                        <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-start' : 'justify-end')}>
                                            {message.role === 'user' && (
                                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">{user?.displayName?.charAt(0)}</div>
                                            )}
                                            <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm", message.role === 'user' ? 'bg-muted' : 'border')}>
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                             {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={t('typeYourMessage')} disabled={isSending} />
                                <Button type="submit" disabled={isSending || !chatInput.trim()}>{t('send')}</Button>
                            </form>
                        </div>
                    ) : chats.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {chats.map((chat) => (
                                <AccordionItem key={chat.id} value={chat.id} className="border rounded-lg bg-muted/20 px-4">
                                    <AccordionTrigger className="w-full hover:no-underline">
                                        <div className="flex items-center justify-between gap-4 w-full">
                                            <div className='flex items-center gap-4'>
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                                <div className='flex-1 text-left'>
                                                    <p className="font-semibold truncate max-w-xs sm:max-w-md">{t('conversationOnDate', { date: format(chat.updatedAt.toDate(), 'PPP') })}</p>
                                                    <p className="text-sm text-muted-foreground">{t('lastMessageOn', { time: format(chat.updatedAt.toDate(), 'p') })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground mb-4 truncate">
                                            {chat.messages.slice(-1)[0]?.content}
                                        </p>
                                        <Button onClick={() => handleContinueChat(chat)}>
                                            {t('continueDialog')} <ArrowRight className='ml-2 h-4 w-4' />
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">{t('noChatsFound')}</p>
                            <Button>
                                {t('startConversationWithGuide')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

