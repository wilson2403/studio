

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
import { Button } from '../ui/button';
import { X, Star, Wand2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';
import { Ceremony, Testimonial } from '@/types';
import { addTestimonial, uploadMedia } from '@/lib/firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { generateTestimonial } from '@/ai/flows/testimonial-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface TestimonialDialogProps {
  user: User;
  ceremony: Ceremony;
  isOpen: boolean;
  onClose: () => void;
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

export default function TestimonialDialog({ user, ceremony, isOpen, onClose }: TestimonialDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [testimonialText, setTestimonialText] = useState('');
  const [rating, setRating] = useState(0);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'text' | 'audio' | 'video'>('text');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const resetState = () => {
    setTestimonialText('');
    setRating(0);
    setConsent(false);
    setIsSubmitting(false);
    setActiveTab('text');
    setMediaFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setShowAIAssist(false);
    setAiKeywords('');
    setIsGenerating(false);
  };
  
  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        resetState();
      }, 300);
      onClose();
    }
  }
  
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
    
    if (activeTab === 'text' && !testimonialText.trim()) {
        toast({ title: t('error'), description: t('testimonialErrorTextRequired'), variant: 'destructive' });
        return;
    }
    
    if (activeTab !== 'text' && !mediaFile) {
        toast({ title: t('error'), description: t('testimonialErrorFileRequired'), variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    let finalContent = testimonialText;

    if (activeTab !== 'text' && mediaFile) {
        setIsUploading(true);
        try {
            const onProgress = (progress: number) => setUploadProgress(progress);
            finalContent = await uploadMedia(mediaFile, onProgress, `testimonials/${activeTab}s`);
        } catch (error) {
            toast({ title: t('errorUploadingFile'), variant: 'destructive' });
            setIsSubmitting(false);
            setIsUploading(false);
            return;
        }
        setIsUploading(false);
    }
    
    try {
        const newTestimonial: Omit<Testimonial, 'id'> = {
            userId: user.uid,
            ceremonyId: ceremony.id,
            type: activeTab,
            content: finalContent,
            rating: rating,
            consent: consent,
            createdAt: new Date(),
            userName: user.displayName || 'Anónimo',
            userPhotoUrl: user.photoURL
        };
        await addTestimonial(newTestimonial);
        toast({ title: t('testimonialSuccessTitle') });
        handleClose(false);
    } catch (error) {
        toast({ title: t('error'), description: t('testimonialErrorSubmit'), variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 border-0 flex flex-col max-h-[90vh]">
        <Button variant="ghost" size="icon" onClick={() => handleClose(false)} className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
        </Button>
        <ScrollArea className="h-full w-full">
            <div className="p-6 text-center space-y-4 flex flex-col justify-center min-h-[calc(90vh-50px)]">
                <DialogHeader>
                    <DialogTitle>{t('testimonialTitle')}</DialogTitle>
                    <DialogDescription>{t('testimonialDescription')}</DialogDescription>
                </DialogHeader>

                <StarRating rating={rating} setRating={setRating} disabled={isSubmitting} />
                
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="text">{t('testimonialText')}</TabsTrigger>
                        <TabsTrigger value="audio">{t('testimonialAudio')}</TabsTrigger>
                        <TabsTrigger value="video">{t('testimonialVideo')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="space-y-4 pt-4">
                        <Textarea
                            value={testimonialText}
                            onChange={(e) => setTestimonialText(e.target.value)}
                            placeholder={t('testimonialPlaceholder')}
                            rows={6}
                            className="text-base"
                            disabled={isSubmitting}
                        />
                         <Button variant="outline" size="sm" onClick={() => setShowAIAssist(!showAIAssist)}>
                           <Wand2 className="mr-2 h-4 w-4"/> {showAIAssist ? t('cancel') : t('generateWithAI')}
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
                    </TabsContent>
                    <TabsContent value="audio">
                        <div className="p-4 border-2 border-dashed rounded-lg space-y-2">
                           <Label htmlFor="audio-upload">{t('uploadAudioFile')}</Label>
                           <Input id="audio-upload" type="file" accept="audio/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} disabled={isSubmitting}/>
                        </div>
                    </TabsContent>
                    <TabsContent value="video">
                         <div className="p-4 border-2 border-dashed rounded-lg space-y-2">
                           <Label htmlFor="video-upload">{t('uploadVideoFile')}</Label>
                           <Input id="video-upload" type="file" accept="video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} disabled={isSubmitting}/>
                        </div>
                    </TabsContent>
                </Tabs>

                {isUploading && (
                    <div className='space-y-1'>
                        <Label>{t('uploadingFile')}</Label>
                        <Progress value={uploadProgress} />
                    </div>
                )}

                <div className="flex items-center space-x-2 justify-center pt-2">
                    <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} disabled={isSubmitting} />
                    <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">{t('testimonialConsent')}</Label>
                </div>
                <Button onClick={handleTestimonialSubmit} disabled={isSubmitting || !consent || rating === 0} className="w-full">
                    {isSubmitting ? t('sending') : t('submitTestimonial')}
                </Button>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
