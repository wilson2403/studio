
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Send, User, X, Mic, NotebookText } from 'lucide-react';
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
import { getUserProfile, UserProfile, getChat, DreamEntry, getDreamEntries } from '@/lib/firebase/firestore';
import { transcribeAudio } from '@/ai/flows/speech-to-text-flow';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { EditableTitle } from '../home/EditableTitle';
import { EditableProvider } from '../home/EditableProvider';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { interpretDreamAndGetRecommendations } from '@/ai/flows/dream-interpreter-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

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
      <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">{dateText}</span>
    </div>
  );
};


export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const locale = i18n.language === 'es' ? es : enUS;

    // Chatbot state
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    
    // Dream interpreter state
    const [dreamInput, setDreamInput] = useState('');
    const [dreamEntries, setDreamEntries] = useState<DreamEntry[]>([]);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [loadingDreams, setLoadingDreams] = useState(true);
    const [isDreamRecording, setIsDreamRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (messages.length) {
            scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);
    
    const fetchChatHistory = async (uid: string) => {
        setChatLoading(true);
        const chatHistory = await getChat(uid);
        if (chatHistory?.messages && chatHistory.messages.length > 0) {
            setMessages(chatHistory.messages);
        } else {
             setMessages([{ role: 'model', content: t('chatbotWelcome'), createdAt: new Date() as any }]);
        }
        setChatLoading(false);
    };
    
    const fetchDreamHistory = async (uid: string) => {
        setLoadingDreams(true);
        const entries = await getDreamEntries(uid);
        setDreamEntries(entries);
        setLoadingDreams(false);
    }

    const handleTabChange = (value: string) => {
        if (user?.uid) {
            if (value === 'guide') {
                fetchChatHistory(user.uid);
            } else if (value === 'dreamer') {
                fetchDreamHistory(user.uid);
            }
        } else {
             if (value === 'guide') {
                setMessages([{ role: 'model', content: t('chatbotWelcome'), createdAt: new Date() as any }]);
             }
        }
    };

    useEffect(() => {
        if (isOpen) {
            const currentChatId = user?.uid || uuidv4();
            setChatId(currentChatId);

            if(user) {
                // Fetch initial tab data
                fetchChatHistory(user.uid);
                fetchDreamHistory(user.uid);
            } else {
                 setMessages([{ role: 'model', content: t('chatbotWelcome'), createdAt: new Date() as any }]);
            }
        } else {
            // Reset on close
            setMessages([]);
            setChatId(null);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [isOpen, user, t]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || chatLoading || !chatId) return;

        const userMessage: ChatMessage = { role: 'user', content: input, createdAt: new Date() as any };
        setMessages(prev => [...prev, userMessage]);
        const question = input;
        setInput('');
        setChatLoading(true);

        try {
            const response = await continueChat({
                chatId: chatId,
                question: question,
                user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null
            });
            
            if (response.answer) {
                setMessages(prev => [...prev, { role: 'model', content: response.answer, createdAt: new Date() as any }]);
            }

        } catch (error) {
            console.error("Error with chat flow:", error);
            setMessages(prev => [...prev, { role: 'model', content: t('chatbotError'), createdAt: new Date() as any }]);
        } finally {
            setChatLoading(false);
        }
    };

     const startRecording = async (inputType: 'chat' | 'dream') => {
        if (isRecording || isDreamRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    try {
                        if (inputType === 'chat') setInput(t('transcribing'));
                        else setDreamInput(t('transcribing'));
                        
                        const { transcription } = await transcribeAudio(base64Audio);
                        
                        if (inputType === 'chat') setInput(transcription);
                        else setDreamInput(transcription);

                    } catch (error) {
                        toast({ title: t('transcriptionErrorTitle'), description: t('transcriptionErrorDescription'), variant: 'destructive' });
                         if (inputType === 'chat') setInput('');
                         else setDreamInput('');
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            if (inputType === 'chat') setIsRecording(true);
            else setIsDreamRecording(true);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ title: t('microphoneErrorTitle'), description: t('microphoneErrorDescription'), variant: 'destructive' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsDreamRecording(false);
    };
    
    const handleInterpretDream = async () => {
        if (!dreamInput.trim()) return;
        if (!user?.uid) {
            toast({ title: t('authRequiredTitle'), description: t('dreamInterpreterAuth'), variant: 'destructive'});
            return;
        }

        setIsInterpreting(true);
        try {
            const { interpretation, recommendations } = await interpretDreamAndGetRecommendations({
                uid: user.uid,
                dream: dreamInput,
                history: dreamEntries,
            });
            
            const newEntry: DreamEntry = {
                date: new Date(),
                dream: dreamInput,
                interpretation,
                recommendations,
            };
            
            setDreamEntries(prev => [newEntry, ...prev]);
            setDreamInput('');

        } catch (error) {
            console.error('Error interpreting dream:', error);
            toast({ title: t('dreamInterpretationError'), variant: 'destructive' });
        } finally {
            setIsInterpreting(false);
        }
    }


    const groupedMessages = useMemo(() => {
        return messages.reduce((acc, message) => {
            const messageDate = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();
            const dateStr = format(messageDate, 'yyyy-MM-dd');
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(message);
            return acc;
        }, {} as Record<string, ChatMessage[]>);
    }, [messages]);
    
     const groupedDreamEntries = useMemo(() => {
        return dreamEntries.reduce((acc, entry) => {
            const dateStr = format(entry.date, 'yyyy-MM-dd');
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(entry);
            return acc;
        }, {} as Record<string, DreamEntry[]>);
    }, [dreamEntries]);


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-40 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500"
                >
                    <Bot className="h-8 w-8" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                className="w-[90vw] max-w-lg h-[80vh] flex flex-col p-0 rounded-xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <EditableProvider>
                     <Tabs defaultValue="guide" className="w-full h-full flex flex-col" onValueChange={handleTabChange}>
                        <div className="flex-shrink-0 p-2 border-b">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="guide">
                                    <Bot className="mr-2 h-4 w-4"/>
                                    {t('spiritualGuide')}
                                </TabsTrigger>
                                <TabsTrigger value="dreamer">
                                    <NotebookText className="mr-2 h-4 w-4"/>
                                    {t('dreamInterpreter')}
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="guide" className="flex-1 flex flex-col min-h-0">
                            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                                <div className="space-y-4">
                                    {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                                        <div key={date}>
                                            <DateSeparator date={parseISO(date)} locale={locale} />
                                            {dayMessages.map((message, index) => (
                                                <div key={index} className={cn("flex items-start gap-3 mt-4", message.role === 'user' ? 'justify-start' : 'justify-start')}>
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
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex items-start gap-3 mt-4">
                                            <Bot className="h-6 w-6 text-primary" />
                                            <div className="bg-transparent border rounded-lg px-4 py-2">
                                                <Skeleton className="h-4 w-10 bg-primary/20" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="flex-shrink-0 p-4 border-t">
                                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={isRecording ? t('recording') : t('typeYourMessage')}
                                        autoComplete="off"
                                        disabled={chatLoading}
                                    />
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        variant={isRecording ? 'destructive' : 'outline'} 
                                        onMouseDown={() => startRecording('chat')}
                                        onMouseUp={stopRecording}
                                        onTouchStart={() => startRecording('chat')}
                                        onTouchEnd={stopRecording}
                                    >
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                    <Button type="submit" size="icon" disabled={chatLoading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </TabsContent>
                        <TabsContent value="dreamer" className="flex-1 flex flex-col min-h-0">
                             <div className="flex-shrink-0 p-4 border-b text-center">
                                <h3 className="text-lg font-headline">{t('dreamInterpreter')}</h3>
                                <p className="text-sm text-muted-foreground">{t('dreamInterpreterDescription')}</p>
                            </div>
                             <ScrollArea className="flex-1 p-4">
                                {loadingDreams ? <Skeleton className="h-full w-full"/> : 
                                    Object.keys(groupedDreamEntries).length === 0 ? (
                                    <p className='text-center text-sm text-muted-foreground pt-4'>{t('noDreamEntries')}</p>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full space-y-2">
                                        {Object.entries(groupedDreamEntries).map(([date, entries]) => (
                                            <AccordionItem key={date} value={date} className="border-none">
                                                <AccordionTrigger className="py-2 px-3 border rounded-md bg-muted/50 hover:no-underline">
                                                    <p className="font-semibold text-sm">{format(parseISO(date), 'PPP', { locale })}</p>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2">
                                                    <div className="space-y-2">
                                                    {entries.map((entry, index) => (
                                                            <div key={index} className="p-3 border rounded-lg bg-muted/30">
                                                            <p className="font-semibold mt-1">{t('yourDream')}</p>
                                                            <p className="text-sm text-muted-foreground italic">"{entry.dream}"</p>
                                                            <p className="font-semibold mt-2">{t('interpretation')}</p>
                                                            <p className="text-sm whitespace-pre-wrap">{entry.interpretation}</p>
                                                            {entry.recommendations?.personal && (
                                                                <>
                                                                    <p className="font-semibold mt-2">{t('recommendations')}</p>
                                                                    <p className="text-sm whitespace-pre-wrap">{entry.recommendations.personal}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </ScrollArea>
                            <div className="flex-shrink-0 p-4 border-t space-y-2">
                                <div className="relative">
                                    <Textarea 
                                        placeholder={isDreamRecording ? t('recording') : t('dreamInputPlaceholder')}
                                        value={dreamInput}
                                        onChange={(e) => setDreamInput(e.target.value)}
                                        rows={3}
                                        className="pr-12"
                                    />
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        variant={isDreamRecording ? 'destructive' : 'ghost'} 
                                        className="absolute right-2 bottom-2"
                                        onMouseDown={() => startRecording('dream')}
                                        onMouseUp={stopRecording}
                                        onTouchStart={() => startRecording('dream')}
                                        onTouchEnd={stopRecording}
                                    >
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button onClick={handleInterpretDream} disabled={isInterpreting || !dreamInput.trim()} className="w-full">
                                    {t('interpretDream')}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </EditableProvider>
            </PopoverContent>
        </Popover>
    );
}

    