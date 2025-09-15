
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Bot, Mic, NotebookText } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';
import { DreamEntry, getDreamEntries } from '@/lib/firebase/firestore';
import { interpretDreamAndGetRecommendations } from '@/ai/flows/dream-interpreter-flow';
import { transcribeAudio } from '@/ai/flows/speech-to-text-flow';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { useAuth } from '@/hooks/useAuth';

export default function DreamInterpreterDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();

    const [dreamInput, setDreamInput] = useState('');
    const [dreamEntries, setDreamEntries] = useState<DreamEntry[]>([]);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [loadingDreams, setLoadingDreams] = useState(true);
    const [lucidDreamingTips, setLucidDreamingTips] = useState<string[]>([]);
    const [isDreamRecording, setIsDreamRecording] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const locale = i18n.language === 'es' ? es : enUS;

    useEffect(() => {
        const fetchDreams = async () => {
            if (user?.uid) {
                setLoadingDreams(true);
                const entries = await getDreamEntries(user.uid);
                setDreamEntries(entries);
                const tips = new Set<string>();
                entries.forEach(entry => {
                    entry.recommendations?.lucidDreaming?.forEach(tip => tips.add(tip));
                });
                setLucidDreamingTips(Array.from(tips));
                setLoadingDreams(false);
            }
        };

        if (isOpen) {
           fetchDreams();
        } else {
             if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [isOpen, user]);

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

    const startRecording = async () => {
        if (isDreamRecording) return;
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
                        setDreamInput(t('transcribing'));
                        const { transcription } = await transcribeAudio(base64Audio);
                        setDreamInput(transcription);
                    } catch (error) {
                        toast({ title: t('transcriptionErrorTitle'), description: t('transcriptionErrorDescription'), variant: 'destructive' });
                        setDreamInput('');
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsDreamRecording(true);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ title: t('microphoneErrorTitle'), description: t('microphoneErrorDescription'), variant: 'destructive' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsDreamRecording(false);
    };
    
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
        <>
            <Button
                variant="outline"
                className="fixed bottom-6 left-6 h-16 w-16 rounded-full shadow-lg z-40 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500"
                onClick={() => setIsOpen(true)}
            >
                <NotebookText className="h-8 w-8" />
            </Button>
             <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[90vw] max-w-lg h-[80vh] flex flex-col p-0 rounded-xl">
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
                        {lucidDreamingTips.length > 0 && (
                            <div className='pt-4 mt-4 border-t'>
                                <h4 className='font-bold text-center mb-2'>{t('lucidDreamingTips')}</h4>
                                <ul className='text-xs list-disc list-inside space-y-1 text-muted-foreground'>
                                    {lucidDreamingTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                </ul>
                            </div>
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
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={handleInterpretDream} disabled={isInterpreting || !dreamInput.trim()} className="w-full">
                    {t('interpretDream')}
                    </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
