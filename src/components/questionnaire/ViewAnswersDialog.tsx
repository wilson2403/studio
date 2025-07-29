
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuestionnaire, QuestionnaireAnswers, UserProfile } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';

interface ViewAnswersDialogProps {
  user: User | UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewAnswersDialog({ user, isOpen, onClose }: ViewAnswersDialogProps) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && user) {
      const fetchAnswers = async () => {
        setLoading(true);
        const data = await getQuestionnaire(user.uid);
        setAnswers(data);
        setLoading(false);
      };
      fetchAnswers();
    }
  }, [isOpen, user]);

  const renderAnswer = (label: string, value?: string, details?: string) => {
    if (value === undefined && details === undefined) return null;

    let displayValue: string;
    if (value) {
        displayValue = t(value);
    } else {
        displayValue = details || t('noDetailsProvided');
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b">
        <dt className="font-semibold text-foreground/90 md:col-span-1">{label}</dt>
        <dd className="text-muted-foreground md:col-span-2">
          {value && <span className={cn('font-medium', { 'text-destructive': value === 'yes', 'text-primary': value === 'no' })}>{displayValue}</span>}
          {details && <p className="mt-1 text-sm whitespace-pre-wrap">{details}</p>}
        </dd>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('myQuestionnaireAnswers')}</DialogTitle>
          <DialogDescription>{t('myQuestionnaireAnswersDescription')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
            <div className="py-4 pr-4">
            {loading ? (
                <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
                </div>
            ) : answers ? (
                <dl>
                {renderAnswer(t('questionnaireMedicalConditions'), answers.hasMedicalConditions, answers.medicalConditionsDetails)}
                {renderAnswer(t('questionnaireMedication'), answers.isTakingMedication, answers.medicationDetails)}
                {renderAnswer(t('questionnaireMentalHealth'), answers.hasMentalHealthHistory, answers.mentalHealthDetails)}
                {renderAnswer(t('questionnaireExperience'), answers.hasPreviousExperience, answers.previousExperienceDetails)}
                {renderAnswer(t('questionnaireIntention'), undefined, answers.mainIntention)}
                </dl>
            ) : (
                <p className="text-center text-muted-foreground py-8">{t('noAnswersSubmitted')}</p>
            )}
            </div>
        </ScrollArea>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">{t('close')}</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
