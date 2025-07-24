
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';


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
}).refine(data => data.hasMedicalConditions === 'no' || (data.hasMedicalConditions === 'yes' && data.medicalConditionsDetails && data.medicalConditionsDetails.trim() !== ''), {
  message: t('errorRequiredDetails'),
  path: ['medicalConditionsDetails'],
}).refine(data => data.isTakingMedication === 'no' || (data.isTakingMedication === 'yes' && data.medicationDetails && data.medicationDetails.trim() !== ''), {
  message: t('errorRequiredDetails'),
  path: ['medicationDetails'],
}).refine(data => data.hasMentalHealthHistory === 'no' || (data.hasMentalHealthHistory === 'yes' && data.mentalHealthDetails && data.mentalHealthDetails.trim() !== ''), {
  message: t('errorRequiredDetails'),
  path: ['mentalHealthDetails'],
}).refine(data => data.hasPreviousExperience === 'no' || (data.hasPreviousExperience === 'yes' && data.previousExperienceDetails && data.previousExperienceDetails.trim() !== ''), {
    message: t('errorRequiredDetails'),
    path: ['previousExperienceDetails'],
});

type FormData = z.infer<ReturnType<typeof questionnaireSchema>>;

const allSteps = [
    { type: 'question', id: 'hasMedicalConditions', icon: HeartPulse, titleKey: 'questionnaireMedicalConditions', descriptionKey: 'questionnaireMedicalConditionsDesc' },
    { type: 'question', id: 'isTakingMedication', icon: Pill, titleKey: 'questionnaireMedication', descriptionKey: 'questionnaireMedicationDesc' },
    { type: 'question', id: 'hasMentalHealthHistory', icon: Brain, titleKey: 'questionnaireMentalHealth', descriptionKey: 'questionnaireMentalHealthDesc' },
    { type: 'question', id: 'hasPreviousExperience', icon: History, titleKey: 'questionnaireExperience', descriptionKey: 'questionnaireExperienceDesc' },
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
      }
      setPageLoading(false);
    });
    return () => unsubscribe();
  }, [api, form]);

 const goToNextStep = async () => {
    const currentStepInfo = allSteps[currentStep];
    if (currentStepInfo.type === 'question' && !isCompleted) {
        const fieldsToValidate = [currentStepInfo.id] as (keyof FormData)[];
        if (currentStepInfo.id === 'hasMedicalConditions') fieldsToValidate.push('medicalConditionsDetails');
        if (currentStepInfo.id === 'isTakingMedication') fieldsToValidate.push('medicationDetails');
        if (currentStepInfo.id === 'hasMentalHealthHistory') fieldsToValidate.push('mentalHealthDetails');
        if (currentStepInfo.id === 'hasPreviousExperience') fieldsToValidate.push('previousExperienceDetails');
        
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

  const getQuestionStepComponent = (id: string) => {
    switch(id) {
        case 'hasMedicalConditions':
        case 'isTakingMedication':
        case 'hasMentalHealthHistory':
        case 'hasPreviousExperience':
            const fieldName = id as "hasMedicalConditions" | "isTakingMedication" | "hasMentalHealthHistory" | "hasPreviousExperience";
            const detailsFieldName = fieldName.replace(/has|is/, '').charAt(0).toLowerCase() + fieldName.replace(/has|is/, '').slice(1) + 'Details' as keyof FormData;
            return (
                <div className="w-full">
                    <FormField
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex justify-center gap-4">
                                <FormItem>
                                    <FormControl><RadioGroupItem value="yes" id={`${id}-yes`} className="sr-only peer" /></FormControl>
                                    <Label htmlFor={`${id}-yes`} className="px-6 py-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10">{t('yes')}</Label>
                                </FormItem>
                                <FormItem>
                                    <FormControl><RadioGroupItem value="no" id={`${id}-no`} className="sr-only peer"/></FormControl>
                                    <Label htmlFor={`${id}-no`} className="px-6 py-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10">{t('no')}</Label>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-center"/>
                            </FormItem>
                        )}
                        />
                        {form.watch(fieldName) === 'yes' && (
                            <FormField control={form.control} name={detailsFieldName} render={({ field }) => (
                                <FormItem className="mt-4"><Label>{t('questionnaireMedicalConditionsDetails')}</Label><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        )}
                </div>
            );
        case 'mainIntention':
            return <FormField control={form.control} name="mainIntention" render={({ field }) => (
                    <FormItem className="w-full"><FormControl><Textarea placeholder={t('questionnaireIntentionPlaceholder')} rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>;
      default: return null;
    }
  }

  const getInfoStepComponent = (id: string) => {
    switch(id) {
      case 'process': return <div className="text-center">{t('preparationProcessDescription')}</div>;
      case 'diet': return (
        <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-green-950/20 border-green-500/30 p-4">
                <CardHeader className="p-2"><CardTitle className="flex items-center gap-2 text-green-400"><Leaf/>{t('allowedFoodsTitle')}</CardTitle></CardHeader>
                <CardContent className="p-2"><p className="text-sm">{t('allowedFoodsList')}</p></CardContent>
            </Card>
            <Card className="bg-red-950/20 border-red-500/30 p-4">
                <CardHeader className="p-2"><CardTitle className="flex items-center gap-2 text-red-400"><Minus/>{t('prohibitedFoodsTitle')}</CardTitle></CardHeader>
                <CardContent className="p-2"><p className="text-sm">{t('prohibitedFoodsList')}</p></CardContent>
            </Card>
        </div>
      );
      case 'mentalPrep':
      case 'emotionalHealing':
      case 'whatToBring':
        return <div className="text-center">{t(`${id}Description`)}</div>;
      default: return null;
    }
  }


  if (pageLoading) {
    return <div className="container py-12 md:py-16"><div className="mx-auto max-w-md"><Skeleton className="h-[85vh] w-full rounded-2xl" /></div></div>;
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

  const isFinalQuestion = allSteps[currentStep]?.id === 'mainIntention';
  const isFinalScreen = allSteps[currentStep]?.type === 'final';

  return (
    <EditableProvider>
      <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
        <Form {...form}>
            <Card className="w-full max-w-md h-[85vh] flex flex-col rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500 overflow-hidden">
                <Carousel setApi={setApi} className="w-full flex-1" opts={{ watchDrag: false, duration: 20 }}>
                    <CarouselContent className="h-full">
                    {allSteps.map((step) => {
                        const Icon = step.icon;
                        return(
                            <CarouselItem key={step.id} className="h-full">
                               <div className="flex flex-col h-full p-6">
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
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
                                        
                                        <ScrollArea className="flex-1 w-full overflow-y-auto">
                                            <div className="p-1">
                                                {step.type === 'question' ? getQuestionStepComponent(step.id) 
                                                : step.type === 'info' ? getInfoStepComponent(step.id) 
                                                : (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Button asChild variant="default" size="lg"><Link href="/courses"><BookOpen className="mr-2 h-4 w-4" />{t('viewCoursesRecommendation')}</Link></Button>
                                                        <Button variant="outline" onClick={() => setIsAnswersDialogOpen(true)}>{t('viewMyAnswers')}</Button>
                                                        <Button variant="ghost" asChild><Link href="/">{t('goHome')}</Link></Button>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                               </div>
                            </CarouselItem>
                        )
                    })}
                    </CarouselContent>
                </Carousel>
                
                {!isFinalScreen && (
                    <CardFooter className="px-6 pb-6 mt-auto flex items-center justify-between bg-card">
                        <Button onClick={goToPrevStep} variant="ghost" disabled={!api?.canScrollPrev() || currentStep === 0}>{t('skip')}</Button>
                        {isFinalQuestion ? (
                            <Button onClick={onQuestionnaireSubmit} disabled={form.formState.isSubmitting}>{t('finish')}</Button>
                        ) : (
                            <Button onClick={goToNextStep} disabled={!api?.canScrollNext()}>{t('continue')}</Button>
                        )}
                    </CardFooter>
                )}
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

    