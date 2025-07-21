
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Send, User, X } from 'lucide-react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ChatMessage, continueChat } from '@/ai/flows/chat-flow';
import { Skeleton } from '../ui/skeleton';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { v4 as uuidv4 } from 'uuid';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const { t } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (messages.length) {
            scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setLoading(true);
            setTimeout(() => {
                setMessages([{ role: 'model', content: t('chatbotWelcome') }]);
                setLoading(false);
            }, 1000);
            setChatId(uuidv4());
        } else if (!isOpen) {
            // Reset on close
            setMessages([]);
            setChatId(null);
        }
    }, [isOpen, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            if (!chatId) {
                console.error("Chat ID is not set!");
                setLoading(false);
                return;
            }
            const response = await continueChat({
                chatId,
                question: input,
                user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null
            });
            
            if (response.answer) {
                setMessages(prev => [...prev, { role: 'model', content: response.answer }]);
            }

        } catch (error) {
            console.error("Error with chat flow:", error);
            setMessages(prev => [...prev, { role: 'model', content: t('chatbotError') }]);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500"
                >
                    <Bot className="h-8 w-8" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                className="w-[90vw] max-w-lg h-[70vh] flex flex-col p-0 rounded-xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <div className='flex items-center gap-3'>
                        <div className="p-2 bg-primary/10 rounded-full">
                           <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-headline">{t('spiritualGuide')}</h3>
                            <p className="text-sm text-muted-foreground">{t('online')}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div ref={scrollAreaRef} className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-start' : 'justify-start')}>
                                {message.role === 'model' ? (
                                    <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                                ) : (
                                     <Avatar className="h-6 w-6 flex-shrink-0">
                                        <AvatarImage src={user?.photoURL || undefined} />
                                        <AvatarFallback>
                                          <User className="h-4 w-4" />
                                        </AvatarFallback>
                                     </Avatar>
                                )}
                                <div className={cn("max-w-xs md:max-w-sm rounded-lg px-4 py-2 text-sm", message.role === 'user' ? 'bg-muted' : 'bg-transparent border')}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        ))}
                         {loading && (
                            <div className="flex items-start gap-3">
                                <Bot className="h-6 w-6 text-primary" />
                                <div className="bg-transparent border rounded-lg px-4 py-2">
                                    <Skeleton className="h-4 w-10 bg-primary/20" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('typeYourMessage')}
                            autoComplete="off"
                            disabled={loading}
                        />
                        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Add this to your dependencies if not present:
// npm install uuid @types/uuid
// yarn add uuid @types/uuid
