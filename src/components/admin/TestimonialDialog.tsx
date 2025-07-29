
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getQuestionnaire, QuestionnaireAnswers, UserProfile, addTestimonial, Testimonial } from '@/lib/firebase/firestore';
import { Button } from '../ui/button';
import { ThumbsUp, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';
import { Ceremony } from '@/types';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '../ui/carousel';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';

interface TestimonialDialogProps {
  user: User;
  ceremony: Ceremony;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestimonialDialog({ user, ceremony, isOpen, onClose }: TestimonialDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [testimonialText, setTestimonialText] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTestimonial, setSubmittedTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    if (!api) return;
    api.on("select", () => setCurrentStep(api.selectedScrollSnap()));
  }, [api]);

  const handleTestimonialSubmit = async () => {
    if (!testimonialText.trim() || !consent) {
        toast({ title: t('error'), description: t('testimonialErrorDescription'), variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
        const newTestimonial: Omit<Testimonial, 'id'> = {
            userId: user.uid,
            ceremonyId: ceremony.id,
            type: 'text',
            content: testimonialText,
            consent: consent,
            createdAt: new Date(),
            userName: user.displayName || 'Anónimo',
            userPhotoUrl: user.photoURL
        };
        await addTestimonial(newTestimonial);
        setSubmittedTestimonial({ ...newTestimonial, id: 'temp-id' });
        toast({ title: t('testimonialSuccessTitle') });
        if (api?.canScrollNext()) api.scrollNext();
    } catch (error) {
        toast({ title: t('error'), description: t('testimonialErrorSubmit'), variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 'form', title: t('testimonialTitle'), description: t('testimonialDescription') },
    { id: 'review', title: t('testimonialReviewTitle'), description: t('testimonialReviewDescription') },
    { id: 'thanks', title: t('thanks'), description: t('testimonialThanksDescription') }
  ];

  const handleClose = (open: boolean) => {
    if (!open) {
        setTimeout(() => {
            api?.scrollTo(0, true);
            setTestimonialText('');
            setConsent(false);
            setSubmittedTestimonial(null);
        }, 300);
        onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 border-0">
            <Carousel setApi={setApi} opts={{ watchDrag: false, duration: 20 }}>
                <CarouselContent>
                    <CarouselItem>
                        <div className="p-6 text-center space-y-4">
                            <DialogHeader>
                                <DialogTitle>{steps[0].title}</DialogTitle>
                                <DialogDescription>{steps[0].description}</DialogDescription>
                            </DialogHeader>
                            <Textarea
                                value={testimonialText}
                                onChange={(e) => setTestimonialText(e.target.value)}
                                placeholder={t('testimonialPlaceholder')}
                                rows={6}
                                className="text-base"
                            />
                            <div className="flex items-center space-x-2 justify-center pt-2">
                                <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} />
                                <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">{t('testimonialConsent')}</Label>
                            </div>
                            <Button onClick={handleTestimonialSubmit} disabled={isSubmitting || !consent || !testimonialText.trim()} className="w-full">
                                {isSubmitting ? t('sending') : t('submitTestimonial')}
                            </Button>
                        </div>
                    </CarouselItem>
                     <CarouselItem>
                         <div className="p-6 text-center space-y-4">
                            <DialogHeader>
                                <DialogTitle>{steps[1].title}</DialogTitle>
                                <DialogDescription>{steps[1].description}</DialogDescription>
                            </DialogHeader>
                            {submittedTestimonial && (
                                <Card className="text-left">
                                    <CardContent className="p-4">
                                        <p className='italic'>"{submittedTestimonial.content}"</p>
                                    </CardContent>
                                </Card>
                            )}
                            <Button onClick={() => api?.scrollNext()} className="w-full">{t('continue')}</Button>
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                       <div className="p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <ThumbsUp className="h-10 w-10 text-primary" />
                            </div>
                            <DialogHeader>
                                <DialogTitle>{steps[2].title}</DialogTitle>
                                <DialogDescription>{steps[2].description}</DialogDescription>
                            </DialogHeader>
                            <Button onClick={() => handleClose(false)} className="w-full">{t('close')}</Button>
                        </div>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
             <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" size="icon" onClick={() => handleClose(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
      </DialogContent>
    </Dialog>
  );
}

