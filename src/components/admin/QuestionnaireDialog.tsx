
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
import { Skeleton } from '@/components/ui/skeleton';
import { getQuestionnaire, QuestionnaireAnswers, UserProfile } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuestionnaireDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestionnaireDialog({ user, isOpen, onClose }: QuestionnaireDialogProps) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { toast } = useToast();

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

  const handleShareQuestionnaire = (uid: string) => {
    if (!uid) return;
    const shareUrl = `${window.location.origin}/questionnaire/${uid}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        toast({ title: t('linkCopied'), description: t('questionnaireShareDescription') });
    }).catch(err => {
        console.error('Failed to copy link:', err);
        toast({ title: t('errorCopyingLink'), variant: 'destructive' });
    });
  };

  const renderAnswer = (label: string, value?: string, details?: string) => {
    if (value === undefined && details === undefined) return null;

    let displayValue: string;
    if (value) {
        displayValue = t(value);
    } else {
        displayValue = details || t('noDetailsProvided');
    }

    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b">
        <dt className="font-semibold text-foreground/90 col-span-1">{label}</dt>
        <dd className="text-muted-foreground col-span-2">
          {value && <span className={`font-medium ${value === 'yes' ? 'text-destructive' : 'text-primary'}`}>{displayValue}</span>}
          {details && <p className="mt-1 text-sm whitespace-pre-wrap">{details}</p>}
        </dd>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div className='flex-1'>
              <DialogTitle>{t('questionnaireResponsesFor', { name: user.displayName || user.email })}</DialogTitle>
              <DialogDescription>{t('questionnaireResponsesDescription')}</DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleShareQuestionnaire(user.uid)}>
              <Share2 className="mr-2 h-4 w-4"/>
              {t('share')}
            </Button>
          </div>
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
      </DialogContent>
    </Dialog>
  );
}
