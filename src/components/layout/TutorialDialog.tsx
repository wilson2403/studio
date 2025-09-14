

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '../ui/carousel';
import { Bot, NotebookText, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialDialog({ isOpen, onClose }: TutorialDialogProps) {
  const { t } = useTranslation();
  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
        if (api) {
            setCurrentStep(api.selectedScrollSnap());
        }
    };
    api.on("select", onSelect);
    // Cleanup
    return () => {
        api.off("select", onSelect);
    };
  }, [api]);

  const tutorialSlides = [
    {
      icon: Bot,
      title: t('tutorialSlideSpiritualGuideTitle'),
      description: t('tutorialSlideSpiritualGuideDescription'),
      image: '/images/tutorial-guide.png'
    },
    {
      icon: NotebookText,
      title: t('tutorialSlideDreamInterpreterTitle'),
      description: t('tutorialSlideDreamInterpreterDescription'),
      image: '/images/tutorial-dream.png'
    },
    {
      icon: Sparkles,
      title: t('tutorialSlidePreparationTitle'),
      description: t('tutorialSlidePreparationDescription'),
      image: '/images/tutorial-prep.png'
    },
    {
      icon: Users,
      title: t('tutorialSlideCommunityTitle'),
      description: t('tutorialSlideCommunityDescription'),
      image: '/images/tutorial-community.png'
    },
  ];

  const handleClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col">
        <DialogHeader className="p-6 text-center">
          <DialogTitle>{t('tutorialTitle')}</DialogTitle>
          <DialogDescription>{t('tutorialDescription')}</DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex flex-col">
            <Carousel setApi={setApi} className='w-full'>
              <CarouselContent>
                {tutorialSlides.map((slide, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col items-center text-center px-6">
                       <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-muted">
                         <Image src={slide.image} alt={slide.title} fill className="object-contain" />
                       </div>
                      <div className="p-2 bg-primary/10 rounded-full mb-4">
                        <slide.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                      <p className="text-muted-foreground text-sm">{slide.description}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
        </div>
        <DialogFooter className="p-6 mt-auto flex-row justify-between items-center w-full">
            <div className="flex items-center justify-center gap-2">
                {tutorialSlides.map((_, i) => (
                    <div key={i} className={cn("h-2 w-2 rounded-full transition-all", i === currentStep ? 'w-4 bg-primary' : 'bg-muted-foreground/30')} />
                ))}
            </div>
            <div className="flex gap-2">
                {currentStep < tutorialSlides.length - 1 ? (
                    <>
                        <Button variant="ghost" onClick={onClose}>{t('tutorialSkip')}</Button>
                        <Button onClick={() => api?.scrollNext()}>{t('tutorialNext')}</Button>
                    </>
                ) : (
                    <Button onClick={onClose} className="w-full">{t('tutorialDone')}</Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
