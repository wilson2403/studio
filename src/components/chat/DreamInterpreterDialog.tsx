

'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { DreamEntry, getDreamEntries } from '@/lib/firebase/firestore';
import { interpretDreamAndGetRecommendations } from '@/ai/flows/dream-interpreter-flow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Mic, NotebookText } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/ai/flows/speech-to-text-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export default function DreamInterpreterDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const [dreamEntries, setDreamEntries] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const routerLocale = i18n.language === 'es' ? es : enUS;

  const [dreamInput, setDreamInput] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchDreams = async () => {
      setLoading(true);
      const entries = await getDreamEntries(user.uid);
      setDreamEntries(entries);
      setLoading(false);
    };

    fetchDreams();
  }, [user, isOpen]);
  
  const handleInterpretDream = async () => {
    if (!dreamInput.trim() || !user?.uid) {
        if (!user?.uid) {
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
        setDreamInput('');
        setActiveAccordionItem(`item-0`);


    } catch (error) {
        console.error('Error interpreting dream:', error);
        toast({ title: t('dreamInterpretationError'), variant: 'destructive' });
    } finally {
        setIsInterpreting(false);
    }
  }

  const startRecording = async () => {
    if (isRecording) return;
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
        setIsRecording(true);

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
            variant="default"
            className="h-16 w-16 rounded-full shadow-lg flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500"
        >
          <NotebookText className="h-8 w-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-lg h-[80vh] flex flex-col p-0 rounded-xl">
        <DialogHeader className="p-4 border-b text-center">
            <DialogTitle>{t('dreamInterpreter')}</DialogTitle>
            <DialogDescription>{t('dreamInterpreterDescription')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4">
            {loading ? <Skeleton className="h-full w-full"/> : 
                dreamEntries.length === 0 ? (
                <p className='text-center text-sm text-muted-foreground pt-4'>{t('noDreamEntries')}</p>
            ) : (
                <Accordion 
                    type="single" 
                    collapsible 
                    className="w-full space-y-2"
                    value={activeAccordionItem}
                    onValueChange={setActiveAccordionItem}
                >
                    {dreamEntries.map((entry, index) => (
                         <AccordionItem key={index} value={`item-${index}`} className="p-3 border rounded-lg bg-muted/30">
                            <AccordionTrigger className="py-0 hover:no-underline text-left">
                                <p className="font-semibold text-sm truncate">{entry.dream}</p>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 mt-2 border-t">
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
                                {entry.recommendations?.lucidDreaming && entry.recommendations.lucidDreaming.length > 0 && (
                                    <>
                                        <p className="font-semibold mt-2">{t('lucidDreamingTips')}</p>
                                        <ul className="text-sm list-disc list-inside mt-1 space-y-1">
                                            {entry.recommendations.lucidDreaming.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </ScrollArea>
        <div className="flex-shrink-0 p-4 border-t space-y-2">
            <div className="relative">
                <Textarea 
                    placeholder={isRecording ? t('recording') : t('dreamInputPlaceholder')}
                    value={dreamInput}
                    onChange={(e) => setDreamInput(e.target.value)}
                    rows={3}
                    className="pr-12"
                />
                <Button 
                    type="button" 
                    size="icon" 
                    variant={isRecording ? 'destructive' : 'ghost'} 
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
                {isInterpreting ? t('interpreting') : t('interpretDream')}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
