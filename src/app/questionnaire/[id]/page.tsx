
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuestionnaire, QuestionnaireAnswers, UserProfile, getUserProfile } from '@/lib/firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Logo } from '@/components/icons/Logo';

export default function SharedQuestionnairePage() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const params = useParams();
  const id = params.id as string;
  const locale = i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    if (id) {
      const fetchAnswers = async () => {
        setLoading(true);
        const [profileData, questionnaireData] = await Promise.all([
          getUserProfile(id),
          getQuestionnaire(id)
        ]);
        setUserProfile(profileData);
        setAnswers(questionnaireData);
        setLoading(false);
      };
      fetchAnswers();
    }
  }, [id]);

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
          {value && <span className={`font-medium ${value === 'yes' ? 'text-destructive' : 'text-primary'}`}>{displayValue}</span>}
          {details && <p className="mt-1 text-sm whitespace-pre-wrap">{details}</p>}
        </dd>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container py-12">
        <Card className="max-w-3xl mx-auto">
          <CardHeader><Skeleton className="h-10 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!answers || !userProfile) {
    return (
      <div className="container py-12">
        <Card className="max-w-3xl mx-auto text-center">
            <CardHeader>
                <CardTitle>{t('error')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{t('questionnaireNotFound')}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
        <Card className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4"><Logo className="h-16 w-16" /></div>
                <CardTitle className="text-3xl font-headline">{t('questionnaireResponsesFor', { name: userProfile.displayName })}</CardTitle>
                {answers.updatedAt && (
                    <CardDescription>
                        {t('completedOn', { date: format(answers.updatedAt.toDate(), 'PPP', { locale }) })}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <dl>
                    {renderAnswer(t('questionnaireMedicalConditions'), answers.hasMedicalConditions, answers.medicalConditionsDetails)}
                    {renderAnswer(t('questionnaireMedication'), answers.isTakingMedication, answers.medicationDetails)}
                    {renderAnswer(t('questionnaireMentalHealth'), answers.hasMentalHealthHistory, answers.mentalHealthDetails)}
                    {renderAnswer(t('questionnaireExperience'), answers.hasPreviousExperience, answers.previousExperienceDetails)}
                    {renderAnswer(t('questionnaireIntention'), undefined, answers.mainIntention)}
                </dl>
            </CardContent>
        </Card>
    </div>
  );
}
