
'use client';

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Star, Wand2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';
import { Ceremony, Testimonial } from '@/types';
import { addTestimonial, logUserAction, getCeremonies, getUserProfile } from '@/lib/firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { generateTestimonial } from '@/ai/flows/testimonial-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { EditableTitle } from '../home/EditableTitle';
import { useEditable } from '../home/EditableProvider';
import { useState, useEffect, useCallback } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Skeleton } from '../ui/skeleton';

interface TestimonialDialogProps {
  user: User | null;
  ceremony?: Ceremony; // Now optional
  children: React.ReactNode;
}

const StarRating = ({ rating, setRating, disabled = false }: { rating: number, setRating: (rating: number) => void, disabled?: boolean }) => {
    return (
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => !disabled && setRating(star)} disabled={disabled} className="disabled:cursor-not-allowed">
                    <Star className={cn("h-8 w-8", star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400')} />
                </button>
            ))}
        </div>
    );
};

const DialogContentWrapper = ({ user, ceremony, isOpen, setIsOpen }: { user: User, ceremony?: Ceremony, isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const { content, fetchContent } = useEditable();
    
    const [testimonialText, setTestimonialText] = useState('');
    const [rating, setRating] = useState(0);
    const [consent, setConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [showAIAssist, setShowAIAssist] = useState(false);
    const [aiKeywords, setAiKeywords] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [assignedCeremonies, setAssignedCeremonies] = useState<Ceremony[]>([]);
    const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | undefined>(ceremony?.id);
    const [loadingCeremonies, setLoadingCeremonies] = useState(!ceremony);

    useEffect(() => {
        fetchContent('testimonialPlaceholder', 'Escribe tu testimonio aquí...');
        fetchContent('generateWithAI', 'Generar con IA');
        fetchContent('submitTestimonial', 'Enviar Testimonio');
        fetchContent('testimonialConsent', 'Doy mi consentimiento para que este testimonio se muestre públicamente en el sitio web.');
        fetchContent('aiKeywordsLabel', 'Describe tu experiencia con palabras clave (ej: sanador, conexión, paz):');
        fetchContent('aiKeywordsPlaceholder', 'Ej: sanador, conexión, paz');
        fetchContent('generateButtonLabel', 'Generar');
        fetchContent('selectCeremonyForTestimonial', 'Selecciona la ceremonia para tu testimonio:');
    }, [fetchContent]);

     useEffect(() => {
        const fetchUserCeremonies = async () => {
            if (user && !ceremony) {
                setLoadingCeremonies(true);
                const profile = await getUserProfile(user.uid);
                const assignedIds = profile?.assignedCeremonies?.map(c => typeof c === 'string' ? c : c.ceremonyId) || [];
                if (assignedIds.length > 0) {
                    const allCeremonies = await getCeremonies();
                    const userCeremonies = allCeremonies.filter(c => assignedIds.includes(c.id));
                    setAssignedCeremonies(userCeremonies);
                }
                setLoadingCeremonies(false);
            }
        };

        if (isOpen) {
            fetchUserCeremonies();
        }
    }, [user, ceremony, isOpen]);

    const getDisplayValue = (id: string, fallback: string) => {
        const value = content[id];
        if (typeof value === 'object' && value !== null) {
            const lang = i18n.language as 'es' | 'en';
            return (value as any)[lang] || (value as any)['es'] || fallback;
        }
        return (value as string) || fallback;
    };

    const handleGenerateWithAI = async () => {
        if (!aiKeywords.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateTestimonial(aiKeywords);
            setTestimonialText(result.testimonial);
            setShowAIAssist(false);
        } catch (error) {
            toast({ title: t('aiErrorTitle'), description: t('aiErrorDescription'), variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleTestimonialSubmit = async () => {
        if (!user || !selectedCeremonyId) {
            if (!selectedCeremonyId) {
                toast({ title: t('error'), description: t('errorSelectCeremony'), variant: 'destructive' });
            }
            return;
        };
        if (!consent || rating === 0) {
            toast({ title: t('error'), description: t('testimonialErrorDescription'), variant: 'destructive' });
            return;
        }
        
        if (!testimonialText.trim()) {
            toast({ title: t('error'), description: t('testimonialErrorTextRequired'), variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const newTestimonial: Omit<Testimonial, 'id'> = {
                userId: user.uid,
                ceremonyId: selectedCeremonyId,
                type: 'text',
                content: testimonialText,
                rating: rating,
                consent: consent,
                createdAt: new Date(),
                userName: user.displayName || 'Anónimo',
                userPhotoUrl: user.photoURL
            };
            const newTestimonialId = await addTestimonial(newTestimonial);
            
            await logUserAction('submit_testimonial', {
                targetId: newTestimonialId,
                targetType: 'testimonial',
                changes: { ceremonyId: selectedCeremonyId, rating }
            });

            toast({ title: t('testimonialSuccessTitle') });
            setIsOpen(false);
        } catch (error) {
            toast({ title: t('error'), description: t('testimonialErrorSubmit'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = useCallback(() => {
        setIsOpen(false);
        // Reset state after closing animation
        setTimeout(() => {
            setTestimonialText('');
            setRating(0);
            setConsent(false);
            setShowAIAssist(false);
            setAiKeywords('');
            setSelectedCeremonyId(ceremony?.id);
        }, 300);
    }, [setIsOpen, ceremony]);


    return (
        <DialogContent className="sm:max-w-md p-0 border-0 flex flex-col max-h-[90vh]">
            <ScrollArea className="h-full w-full">
                <div className="p-6 text-center space-y-4 flex flex-col justify-center">
                    <DialogHeader>
                        <DialogTitle>
                           <EditableTitle tag="h2" id="testimonialDialogTitle" initialValue={t('testimonialTitle')} className="text-2xl" />
                        </DialogTitle>
                        <DialogDescription>
                             <EditableTitle tag="p" id="testimonialDialogDescription" initialValue={t('testimonialDescription')} />
                        </DialogDescription>
                    </DialogHeader>

                     {!ceremony && (
                        <div className="text-left space-y-2">
                             <Label htmlFor="ceremony-select">
                                <EditableTitle tag="span" id="selectCeremonyForTestimonial" initialValue={t('selectCeremonyForTestimonial')} />
                             </Label>
                             {loadingCeremonies ? <Skeleton className="h-10 w-full" /> : (
                                <Select onValueChange={setSelectedCeremonyId} value={selectedCeremonyId}>
                                    <SelectTrigger id="ceremony-select">
                                        <SelectValue placeholder={t('selectCeremony')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {assignedCeremonies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                             )}
                        </div>
                    )}


                    <StarRating rating={rating} setRating={setRating} disabled={isSubmitting} />
                    
                    <div className="w-full">
                        <div className="space-y-4 pt-4">
                            <Textarea
                                value={testimonialText}
                                onChange={(e) => setTestimonialText(e.target.value)}
                                placeholder={getDisplayValue('testimonialPlaceholder', 'Escribe tu testimonio aquí...')}
                                rows={6}
                                className="text-base"
                                disabled={isSubmitting}
                            />
                            <Button variant="outline" size="sm" onClick={() => setShowAIAssist(!showAIAssist)}>
                                <Wand2 className="mr-2 h-4 w-4"/>
                                <span className='flex-grow'>{getDisplayValue('generateWithAI', 'Generar con IA')}</span>
                            </Button>
                            {showAIAssist && (
                                <div className="p-4 border rounded-lg bg-muted/50 space-y-2 animate-in fade-in-0">
                                    <Label htmlFor="ai-keywords">
                                       <EditableTitle tag="span" id="aiKeywordsLabel" initialValue={t('aiKeywordsLabel')} />
                                    </Label>
                                    <Textarea 
                                        id="ai-keywords"
                                        value={aiKeywords}
                                        onChange={(e) => setAiKeywords(e.target.value)}
                                        placeholder={getDisplayValue('aiKeywordsPlaceholder', 'Ej: sanador, conexión, paz')}
                                        rows={2}
                                        disabled={isGenerating}
                                    />
                                    <Button onClick={handleGenerateWithAI} disabled={isGenerating || !aiKeywords.trim()}>
                                        <Sparkles className="mr-2 h-4 w-4"/>
                                        {isGenerating ? t('generating') : getDisplayValue('generateButtonLabel', 'Generar')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 justify-center pt-2">
                        <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} disabled={isSubmitting} />
                        <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">
                            <EditableTitle tag="span" id="testimonialConsent" initialValue={t('testimonialConsent')} />
                        </Label>
                    </div>
                     <Button onClick={handleTestimonialSubmit} disabled={isSubmitting || !consent || rating === 0 || !testimonialText.trim() || !selectedCeremonyId}>
                         {isSubmitting ? t('sending') : getDisplayValue('submitTestimonial', 'Enviar Testimonio')}
                    </Button>
                </div>
            </ScrollArea>
        </DialogContent>
    )
}

export default function TestimonialDialog({ user, ceremony, children }: TestimonialDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {isOpen && user && <DialogContentWrapper user={user} ceremony={ceremony} isOpen={isOpen} setIsOpen={setIsOpen} />}
    </Dialog>
  );
}
