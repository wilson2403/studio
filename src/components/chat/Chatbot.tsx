
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Send, User, X, Mic, NotebookText, MessageCircle } from 'lucide-react';
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
import { getUserProfile, UserProfile, getDreamEntries, DreamEntry, saveDreamEntry } from '@/lib/firebase/firestore';
import { interpretDreamAndGetRecommendations } from '@/ai/flows/dream-interpreter-flow';
import { transcribeAudio } from '@/ai/flows/speech-to-text-flow';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const { t, i18n } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const { toast } = useToast();

    // Dream Interpreter State
    const [dreamInput, setDreamInput] = useState('');
    const [dreamEntries, setDreamEntries] = useState<DreamEntry[]>([]);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [loadingDreams, setLoadingDreams] = useState(false);
    const [lucidDreamingTips, setLucidDreamingTips] = useState<string[]>([]);
    const [isDreamRecording, setIsDreamRecording] = useState(false);

    const locale = i18n.language === 'es' ? es : enUS;

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
             if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (messages.length) {
            scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const fetchUserDreamEntries = async () => {
            if (user?.uid) {
                setLoadingDreams(true);
                const entries = await getDreamEntries(user.uid);
                setDreamEntries(entries);
                // Extract unique tips
                const tips = new Set<string>();
                entries.forEach(entry => {
                    entry.recommendations?.lucidDreaming?.forEach(tip => tips.add(tip));
                });
                setLucidDreamingTips(Array.from(tips));
                setLoadingDreams(false);
            }
        };

        if (isOpen && messages.length === 0) {
            setLoading(true);
            setTimeout(() => {
                setMessages([{ role: 'model', content: t('chatbotWelcome') }]);
                setLoading(false);
            }, 1000);
            
            if (user?.email) {
                setChatId(user.email);
            } else {
                setChatId(uuidv4());
            }

            fetchUserDreamEntries();

        } else if (!isOpen) {
            // Reset on close
            setMessages([]);
            setChatId(null);
            setDreamEntries([]);
            setDreamInput('');
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [isOpen, t, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const question = input;
        setInput('');
        setLoading(true);

        try {
            let currentChatId = chatId;
            if (!currentChatId) {
                const newId = user?.email || uuidv4();
                setChatId(newId);
                currentChatId = newId;
            }

            const response = await continueChat({
                chatId: currentChatId,
                question: question,
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
    
    const handleInterpretDream = async () => {
        if (!dreamInput.trim() || !user?.uid) {
            if (!user) {
                toast({ title: t('authRequiredTitle'), description: t('dreamInterpreterAuth'), variant: 'destructive'});
            }
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
             // Extract unique tips
            const tips = new Set<string>(lucidDreamingTips);
            recommendations?.lucidDreaming?.forEach(tip => tips.add(tip));
            setLucidDreamingTips(Array.from(tips));

            setDreamInput('');

        } catch (error) {
            console.error('Error interpreting dream:', error);
            toast({ title: t('dreamInterpretationError'), variant: 'destructive' });
        } finally {
            setIsInterpreting(false);
        }
    }
    
     const startRecording = async (target: 'chat' | 'dream') => {
        if (isRecording || isDreamRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    try {
                        if (target === 'chat') {
                            setInput(t('transcribing'));
                        } else {
                            setDreamInput(t('transcribing'));
                        }
                        const { transcription } = await transcribeAudio(base64Audio);
                        if (target === 'chat') {
                            setInput(transcription);
                        } else {
                            setDreamInput(transcription);
                        }
                    } catch (error) {
                        toast({ title: t('transcriptionErrorTitle'), description: t('transcriptionErrorDescription'), variant: 'destructive' });
                        if (target === 'chat') setInput('');
                        else setDreamInput('');
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            if (target === 'chat') setIsRecording(true);
            else setIsDreamRecording(true);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ title: t('microphoneErrorTitle'), description: t('microphoneErrorDescription'), variant: 'destructive' });
        }
    };

    const stopRecording = (target: 'chat' | 'dream') => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (target === 'chat') setIsRecording(false);
        else setIsDreamRecording(false);
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
                <Tabs defaultValue="guide" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="guide"><MessageCircle className="mr-2"/>{t('spiritualGuide')}</TabsTrigger>
                        <TabsTrigger value="interpreter"><NotebookText className="mr-2"/>{t('dreamInterpreter')}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="guide" className="flex-1 flex flex-col h-0">
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
                                    placeholder={isRecording ? t('recording') : t('typeYourMessage')}
                                    autoComplete="off"
                                    disabled={loading}
                                />
                                <Button 
                                    type="button" 
                                    size="icon" 
                                    variant={isRecording ? 'destructive' : 'outline'} 
                                    onMouseDown={() => startRecording('chat')}
                                    onMouseUp={() => stopRecording('chat')}
                                    onTouchStart={() => startRecording('chat')}
                                    onTouchEnd={() => stopRecording('chat')}
                                >
                                    <Mic className="h-4 w-4" />
                                </Button>
                                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="interpreter" className="flex-1 flex flex-col h-0">
                         <div className="p-4 border-b text-center">
                            <h3 className="text-lg font-headline">{t('dreamInterpreter')}</h3>
                            <p className="text-sm text-muted-foreground">{t('dreamInterpreterDescription')}</p>
                         </div>
                         <div className="flex-1 flex flex-col p-4 gap-4">
                            <div className="relative">
                                <Textarea 
                                    placeholder={isDreamRecording ? t('recording') : t('dreamInputPlaceholder')}
                                    value={dreamInput}
                                    onChange={(e) => setDreamInput(e.target.value)}
                                    rows={4}
                                    className="pr-12"
                                />
                                 <Button 
                                    type="button" 
                                    size="icon" 
                                    variant={isDreamRecording ? 'destructive' : 'ghost'} 
                                    className="absolute right-2 bottom-2"
                                    onMouseDown={() => startRecording('dream')}
                                    onMouseUp={() => stopRecording('dream')}
                                    onTouchStart={() => startRecording('dream')}
                                    onTouchEnd={() => stopRecording('dream')}
                                >
                                    <Mic className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button onClick={handleInterpretDream} disabled={isInterpreting || !dreamInput.trim()}>
                                {isInterpreting ? t('interpreting') : t('interpretDream')}
                            </Button>
                            
                            <ScrollArea className="flex-1 -mx-4">
                                <div className="px-4 space-y-4">
                                {loadingDreams && <Skeleton className="h-24 w-full"/>}
                                {!loadingDreams && dreamEntries.length === 0 && (
                                    <p className='text-center text-sm text-muted-foreground pt-4'>{t('noDreamEntries')}</p>
                                )}
                                {dreamEntries.map((entry, index) => (
                                    <div key={index} className="p-3 border rounded-lg bg-muted/30">
                                        <p className="text-xs text-muted-foreground">{format(entry.date, 'PPP', { locale })}</p>
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
                            </ScrollArea>
                            {lucidDreamingTips.length > 0 && (
                                <div className='pt-4 border-t'>
                                    <h4 className='font-bold text-center mb-2'>{t('lucidDreamingTips')}</h4>
                                    <ul className='text-xs list-disc list-inside space-y-1 text-muted-foreground'>
                                        {lucidDreamingTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                    </ul>
                                </div>
                            )}
                         </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
