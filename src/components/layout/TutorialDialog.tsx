

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
import { EditableTitle } from '../home/EditableTitle';
import { EditableProvider } from '../home/EditableProvider';
import { User } from 'firebase/auth';
import { markTutorialAsSeen } from '@/lib/firebase/firestore';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function TutorialDialog({ isOpen, onClose, user }: TutorialDialogProps) {
  const { t, i18n } = useTranslation();
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
      titleKey: 'tutorialSlideSpiritualGuideTitle',
      descriptionKey: 'tutorialSlideSpiritualGuideDescription',
    },
    {
      icon: NotebookText,
      titleKey: 'tutorialSlideDreamInterpreterTitle',
      descriptionKey: 'tutorialSlideDreamInterpreterDescription',
    },
    {
      icon: Sparkles,
      titleKey: 'tutorialSlidePreparationTitle',
      descriptionKey: 'tutorialSlidePreparationDescription',
    },
    {
      icon: Users,
      titleKey: 'tutorialSlideCommunityTitle',
      descriptionKey: 'tutorialSlideCommunityDescription',
    },
  ];

  const handleClose = (open: boolean) => {
    if (!open) {
      if (user) {
        markTutorialAsSeen(user.uid);
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col">
        <EditableProvider>
            <DialogHeader className="p-6 text-center">
                <DialogTitle>
                    <EditableTitle tag="h2" id="tutorialTitle" initialValue={t('tutorialTitle')} className="text-lg font-semibold" />
                </DialogTitle>
                <DialogDescription>
                    <EditableTitle tag="span" id="tutorialDescription" initialValue={t('tutorialDescription')} />
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow flex flex-col">
                <Carousel setApi={setApi} className='w-full'>
                  <CarouselContent>
                    {tutorialSlides.map((slide, index) => (
                      <CarouselItem key={index}>
                        <div className="flex flex-col items-center text-center px-6">
                          <div className="p-2 bg-primary/10 rounded-full mb-4">
                            <slide.icon className="h-8 w-8 text-primary" />
                          </div>
                          <EditableTitle tag="h3" id={slide.titleKey} initialValue={t(slide.titleKey)} className="text-xl font-bold mb-2" />
                          <EditableTitle tag="p" id={slide.descriptionKey} initialValue={t(slide.descriptionKey)} className="text-muted-foreground text-sm" />
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
                            <Button variant="ghost" onClick={() => handleClose(false)}><EditableTitle tag="span" id="tutorialSkip" initialValue={t('tutorialSkip')} isInsideButton/></Button>
                            <Button onClick={() => api?.scrollNext()}><EditableTitle tag="span" id="tutorialNext" initialValue={t('tutorialNext')} isInsideButton/></Button>
                        </>
                    ) : (
                        <Button onClick={() => handleClose(false)} className="w-full"><EditableTitle tag="span" id="tutorialDone" initialValue={t('tutorialDone')} isInsideButton/></Button>
                    )}
                </div>
            </DialogFooter>
        </EditableProvider>
      </DialogContent>
    </Dialog>
  );
}
