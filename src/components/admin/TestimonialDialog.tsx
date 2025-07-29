
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
import { addTestimonial } from '@/lib/firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { generateTestimonial } from '@/ai/flows/testimonial-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { EditableTitle } from '../home/EditableTitle';
import { useEditable } from '../home/EditableProvider';
import { useState, useEffect } from 'react';

interface TestimonialDialogProps {
  user: User;
  ceremony: Ceremony;
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

const DialogContentWrapper = ({ user, ceremony, setIsOpen }: { user: User, ceremony: Ceremony, setIsOpen: (open: boolean) => void }) => {
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

    useEffect(() => {
        fetchContent('testimonialPlaceholder', 'Escribe tu testimonio aquí...');
    }, [fetchContent]);

    const getDisplayValue = (id: string, fallback: string) => {
        const value = content[id];
        if (typeof value === 'object' && value !== null) {
            return (value as any)[i18n.language as 'es' | 'en'] || (value as any)['es'] || fallback;
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
                ceremonyId: ceremony.id,
                type: 'text',
                content: testimonialText,
                rating: rating,
                consent: consent,
                createdAt: new Date(),
                userName: user.displayName || 'Anónimo',
                userPhotoUrl: user.photoURL
            };
            await addTestimonial(newTestimonial);
            toast({ title: t('testimonialSuccessTitle') });
            setIsOpen(false);
        } catch (error) {
            toast({ title: t('error'), description: t('testimonialErrorSubmit'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

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

                    <StarRating rating={rating} setRating={setRating} disabled={isSubmitting} />
                    
                    <div className="w-full">
                        <div className="space-y-4 pt-4">
                            <Textarea
                                value={testimonialText}
                                onChange={(e) => setTestimonialText(e.target.value)}
                                placeholder={getDisplayValue('testimonialPlaceholder', t('testimonialPlaceholder'))}
                                rows={6}
                                className="text-base"
                                disabled={isSubmitting}
                            />
                            <Button variant="outline" size="sm" onClick={() => setShowAIAssist(!showAIAssist)}>
                                <Wand2 className="mr-2 h-4 w-4"/>
                                <EditableTitle tag="p" id="generateWithAI" initialValue={showAIAssist ? t('cancel') : t('generateWithAI')} />
                            </Button>
                            {showAIAssist && (
                                <div className="p-4 border rounded-lg bg-muted/50 space-y-2 animate-in fade-in-0">
                                    <Label htmlFor="ai-keywords">{t('aiKeywordsLabel')}</Label>
                                    <Textarea 
                                        id="ai-keywords"
                                        value={aiKeywords}
                                        onChange={(e) => setAiKeywords(e.target.value)}
                                        placeholder={t('aiKeywordsPlaceholder')}
                                        rows={2}
                                        disabled={isGenerating}
                                    />
                                    <Button onClick={handleGenerateWithAI} disabled={isGenerating || !aiKeywords.trim()}>
                                        {isGenerating ? t('generating') : <><Sparkles className="mr-2 h-4 w-4"/> {t('generate')}</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 justify-center pt-2">
                        <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} disabled={isSubmitting} />
                        <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">
                            <EditableTitle tag="p" id="testimonialConsent" initialValue={t('testimonialConsent')} />
                        </Label>
                    </div>
                    <Button onClick={handleTestimonialSubmit} disabled={isSubmitting || !consent || rating === 0 || !testimonialText.trim()} className="w-full">
                        {isSubmitting ? t('sending') : <EditableTitle tag="p" id="submitTestimonial" initialValue={t('submitTestimonial')} />}
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
      {isOpen && <DialogContentWrapper user={user} ceremony={ceremony} setIsOpen={setIsOpen} />}
    </Dialog>
  );
}
