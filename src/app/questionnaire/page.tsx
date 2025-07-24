
'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getQuestionnaire, saveQuestionnaire, QuestionnaireAnswers, getUserProfile, updatePreparationProgress } from '@/lib/firebase/firestore';
import { BookOpen, PartyPopper, HeartPulse, Pill, Brain, History, Sprout, Wind, HeartHandshake, Leaf, Minus, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import ViewAnswersDialog from '@/components/questionnaire/ViewAnswersDialog';
import { EditableProvider } from '@/components/home/EditableProvider';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const questionnaireSchema = (t: (key: string, options?: any) => string) => z.object({
  hasMedicalConditions: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  medicalConditionsDetails: z.string().optional(),
  isTakingMedication: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  medicationDetails: z.string().optional(),
  hasMentalHealthHistory: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  mentalHealthDetails: z.string().optional(),
  mainIntention: z.string().min(10, { message: t('errorMinLength', { field: t('questionnaireIntention'), count: 10 }) }),
  hasPreviousExperience: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  previousExperienceDetails: z.string().optional(),
}).refine(data => data.hasMedicalConditions !== 'yes' || (data.medicalConditionsDetails && data.medicalConditionsDetails.trim().length > 0), {
  message: t('errorRequiredDetails'),
  path: ['medicalConditionsDetails'],
}).refine(data => data.isTakingMedication !== 'yes' || (data.medicationDetails && data.medicationDetails.trim().length > 0), {
  message: t('errorRequiredDetails'),
  path: ['medicationDetails'],
}).refine(data => data.hasMentalHealthHistory !== 'yes' || (data.mentalHealthDetails && data.mentalHealthDetails.trim().length > 0), {
  message: t('errorRequiredDetails'),
  path: ['mentalHealthDetails'],
}).refine(data => data.hasPreviousExperience !== 'yes' || (data.previousExperienceDetails && data.previousExperienceDetails.trim().length > 0), {
    message: t('errorRequiredDetails'),
    path: ['previousExperienceDetails'],
});

type FormData = z.infer<ReturnType<typeof questionnaireSchema>>;

const allSteps = [
    { type: 'question', id: 'hasMedicalConditions', icon: HeartPulse, titleKey: 'questionnaireMedicalConditions', descriptionKey: 'questionnaireMedicalConditionsDesc', detailsLabelKey: 'questionnaireMedicalConditionsDetails' },
    { type: 'question', id: 'isTakingMedication', icon: Pill, titleKey: 'questionnaireMedication', descriptionKey: 'questionnaireMedicationDesc', detailsLabelKey: 'questionnaireMedicationDetails' },
    { type: 'question', id: 'hasMentalHealthHistory', icon: Brain, titleKey: 'questionnaireMentalHealth', descriptionKey: 'questionnaireMentalHealthDesc', detailsLabelKey: 'questionnaireMentalHealthDetails' },
    { type: 'question', id: 'hasPreviousExperience', icon: History, titleKey: 'questionnaireExperience', descriptionKey: 'questionnaireExperienceDesc', detailsLabelKey: 'questionnaireExperienceDetails' },
    { type: 'question', id: 'mainIntention', icon: Sprout, titleKey: 'questionnaireIntention', descriptionKey: 'questionnaireIntentionDesc' },
    { type: 'info', id: 'process', icon: Wind, titleKey: 'preparationProcessTitle', descriptionKey: 'preparationGuideFullSubtitle' },
    { type: 'info', id: 'diet', icon: Leaf, titleKey: 'dietTitle', descriptionKey: 'dietSubtitle' },
    { type: 'info', id: 'mentalPrep', icon: Sparkles, titleKey: 'mentalPrepTitle', descriptionKey: 'mentalPrepSubtitle' },
    { type: 'info', id: 'emotionalHealing', icon: HeartHandshake, titleKey: 'emotionalHealingTitle', descriptionKey: 'emotionalHealingSubtitle' },
    { type: 'info', id: 'whatToBring', icon: CheckCircle, titleKey: 'whatToBringTitle', descriptionKey: 'whatToBringSubtitle' },
    { type: 'final', id: 'final', icon: PartyPopper, titleKey: 'preparationCompleteTitle', descriptionKey: 'preparationCompleteDescription' }
];

export default function QuestionnairePage() {
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>()
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnswersDialogOpen, setIsAnswersDialogOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(questionnaireSchema(t)),
    mode: 'onChange',
  });

  const updateUserProgress = useCallback(async (step: number) => {
    if (user && !isCompleted) {
      await updatePreparationProgress(user.uid, step);
    }
  }, [user, isCompleted]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
        const newStep = api.selectedScrollSnap();
        if (newStep !== currentStep) {
            setCurrentStep(newStep);
            updateUserProgress(newStep);
        }
    };
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, updateUserProgress, currentStep]);

  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          setDataLoading(true);
          const profile = await getUserProfile(currentUser.uid);
          const savedAnswers = await getQuestionnaire(currentUser.uid);
          
          if (profile?.questionnaireCompleted) setIsCompleted(true);
          if (savedAnswers) form.reset(savedAnswers);
          
          if (api) {
            const targetStep = profile?.questionnaireCompleted ? allSteps.length - 1 : (profile?.preparationStep || 0);
            api.scrollTo(targetStep, true);
            setCurrentStep(targetStep);
          }
        } catch (error) { console.error("Error fetching user data:", error); }
        finally { setDataLoading(false); }
      }
      setPageLoading(false);
    });
    return () => unsubscribe();
  }, [api, form]);

 const goToNextStep = async () => {
    const currentStepInfo = allSteps[currentStep];
    if (currentStepInfo.type === 'question' && !isCompleted) {
        const fieldsToValidate = [currentStepInfo.id] as (keyof FormData)[];
        if (currentStepInfo.id === 'hasMedicalConditions' && form.getValues('hasMedicalConditions') === 'yes') fieldsToValidate.push('medicalConditionsDetails');
        if (currentStepInfo.id === 'isTakingMedication' && form.getValues('isTakingMedication') === 'yes') fieldsToValidate.push('medicationDetails');
        if (currentStepInfo.id === 'hasMentalHealthHistory' && form.getValues('hasMentalHealthHistory') === 'yes') fieldsToValidate.push('mentalHealthDetails');
        if (currentStepInfo.id === 'hasPreviousExperience' && form.getValues('hasPreviousExperience') === 'yes') fieldsToValidate.push('previousExperienceDetails');
        
        const isValid = await form.trigger(fieldsToValidate);
        if (!isValid) {
            toast({ title: t('pleaseCompleteThisStep'), variant: 'destructive' });
            return;
        }
    }
    if (api?.canScrollNext()) api.scrollNext();
  };
  
  const goToPrevStep = () => { if(api?.canScrollPrev()) api.scrollPrev(); }

  const onQuestionnaireSubmit = async () => {
    if (!user) return;
    if (isCompleted) {
        goToNextStep();
        return;
    };
    try {
        await saveQuestionnaire(user.uid, form.getValues());
        setIsCompleted(true);
        goToNextStep();
    } catch (error) {
        toast({ title: t('questionnaireErrorTitle'), description: t('questionnaireErrorDescription'), variant: 'destructive' });
    }
  };

  const getQuestionStepComponent = (stepInfo: (typeof allSteps)[number]) => {
    switch(stepInfo.id) {
        case 'hasMedicalConditions':
        case 'isTakingMedication':
        case 'hasMentalHealthHistory':
        case 'hasPreviousExperience':
            const fieldName = stepInfo.id as "hasMedicalConditions" | "isTakingMedication" | "hasMentalHealthHistory" | "hasPreviousExperience";
            const detailsFieldName = stepInfo.id.replace(/has|is/, '').charAt(0).toLowerCase() + stepInfo.id.replace(/has|is/, '').slice(1) + 'Details' as keyof FormData;
            return (
                <div className="w-full">
                    <FormField
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex justify-center gap-4" disabled={isCompleted}>
                                <FormItem>
                                    <FormControl><RadioGroupItem value="yes" id={`${stepInfo.id}-yes`} className="sr-only peer" /></FormControl>
                                    <Label htmlFor={`${stepInfo.id}-yes`} className="px-6 py-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10">{t('yes')}</Label>
                                </FormItem>
                                <FormItem>
                                    <FormControl><RadioGroupItem value="no" id={`${stepInfo.id}-no`} className="sr-only peer"/></FormControl>
                                    <Label htmlFor={`${stepInfo.id}-no`} className="px-6 py-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10">{t('no')}</Label>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-center"/>
                            </FormItem>
                        )}
                        />
                        {form.watch(fieldName) === 'yes' && (
                            <FormField control={form.control} name={detailsFieldName} render={({ field }) => (
                                <FormItem className="mt-4"><Label>{t(stepInfo.detailsLabelKey || '')}</Label><FormControl><Textarea {...field} disabled={isCompleted} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        )}
                </div>
            );
        case 'mainIntention':
            return <FormField control={form.control} name="mainIntention" render={({ field }) => (
                    <FormItem className="w-full"><FormControl><Textarea placeholder={t('questionnaireIntentionPlaceholder')} rows={5} {...field} disabled={isCompleted} /></FormControl><FormMessage /></FormItem>
                )}/>;
      default: return null;
    }
  }

  const getInfoStepComponent = (step: (typeof allSteps)[number]) => {
    return <div className="text-center">{t(step.descriptionKey)}</div>;
  }


  if (pageLoading) {
    return <div className="container py-12 md:py-16"><div className="mx-auto max-w-md"><Skeleton className="h-[70vh] w-full rounded-2xl" /></div></div>;
  }
  
  if (!user) {
    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader><CardTitle>{t('authRequiredJourneyTitle')}</CardTitle><CardDescription>{t('authRequiredJourneyDescription')}</CardDescription></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button asChild className="w-full"><Link href="/login?redirect=/questionnaire">{t('signIn')}</Link></Button>
                    <Button asChild variant="secondary" className="w-full"><Link href="/register?redirect=/questionnaire">{t('registerButton')}</Link></Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <EditableProvider>
      <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
        <Form {...form}>
            <Card className="w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500">
                <Carousel setApi={setApi} className="w-full" opts={{ watchDrag: false, duration: 20 }}>
                    <CarouselContent>
                    {allSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isFinalQuestion = step.id === 'mainIntention';
                        const isFinalScreen = step.type === 'final';
                        return(
                            <CarouselItem key={step.id}>
                               <div className="p-6">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        {dataLoading ? (
                                            <div className='w-full space-y-4'>
                                                <Skeleton className='h-20 w-20 rounded-full mx-auto' />
                                                <Skeleton className='h-8 w-3/4 mx-auto' />
                                                <Skeleton className='h-24 w-full mx-auto' />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-primary/10 rounded-full mb-6">
                                                    <Icon className="h-10 w-10 text-primary" data-ai-hint="spiritual icon" />
                                                </div>
                                                <div className="flex items-center justify-center gap-1.5 mb-6">
                                                    {allSteps.map((_, i) => (
                                                        <div key={i} className={cn("h-1.5 w-1.5 rounded-full transition-all", i === currentStep ? 'w-4 bg-primary' : 'bg-muted-foreground/30')} />
                                                    ))}
                                                </div>
                                                <h2 className="text-2xl font-headline font-bold mb-2">{t(step.titleKey)}</h2>
                                                <p className="text-muted-foreground mb-4">{t(step.descriptionKey)}</p>
                                                
                                                <div className="p-1 w-full">
                                                    {step.type === 'question' ? getQuestionStepComponent(step) 
                                                    : step.type === 'info' ? getInfoStepComponent(step) 
                                                    : (
                                                        <div className="flex flex-col items-center gap-4">
                                                            <Button asChild variant="default" size="lg"><Link href="/courses"><BookOpen className="mr-2 h-4 w-4" />{t('viewCoursesRecommendation')}</Link></Button>
                                                            <Button variant="outline" onClick={() => setIsAnswersDialogOpen(true)}>{t('viewMyAnswers')}</Button>
                                                            <Button variant="ghost" asChild><Link href="/">{t('goHome')}</Link></Button>
                                                        </div>
                                                    )}
                                                </div>
                                                {!dataLoading && (
                                                    <div className="mt-6 flex w-full items-center justify-between">
                                                        <Button onClick={goToPrevStep} variant="ghost" disabled={!api?.canScrollPrev() || (currentStep === 0 && !isCompleted)}>{t('previous')}</Button>
                                                        
                                                        {!isFinalScreen && (
                                                            isFinalQuestion ? (
                                                                <Button onClick={onQuestionnaireSubmit} disabled={form.formState.isSubmitting}>{t('finish')}</Button>
                                                            ) : (
                                                                <Button onClick={goToNextStep} disabled={!api?.canScrollNext()}>{t('continue')}</Button>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                               </div>
                            </CarouselItem>
                        )
                    })}
                    </CarouselContent>
                </Carousel>
            </Card>
        </Form>
      </div>
      {user && (
          <ViewAnswersDialog
              user={user}
              isOpen={isAnswersDialogOpen}
              onClose={() => setIsAnswersDialogOpen(false)}
          />
      )}
    </EditableProvider>
  );
}
