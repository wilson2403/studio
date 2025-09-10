
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useParams, useRouter } from 'next/navigation';
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
import { BookOpen, PartyPopper, HeartPulse, Pill, Brain, History, Sprout, Wind, HeartHandshake, Leaf, Minus, Sparkles, CheckCircle, Bot } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import ViewAnswersDialog from '@/components/questionnaire/ViewAnswersDialog';
import { EditableProvider } from '@/components/home/EditableProvider';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { EditableTitle } from '@/components/home/EditableTitle';

const questionnaireSchema = (t: (key: string, options?: any) => string) => z.object({
  hasMedicalConditions: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  medicalConditionsDetails: z.string().optional(),
  isTakingMedication: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  medicationDetails: z.string().optional(),
  hasMentalHealthHistory: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  mentalHealthDetails: z.string().optional(),
  hasPreviousExperience: z.enum(['yes', 'no'], { required_error: t('errorRequiredSimple') }),
  previousExperienceDetails: z.string().optional(),
  mainIntention: z.string().min(10, { message: t('errorMinLength', { field: t('questionnaireIntention'), count: 10 }) }),
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

export default function QuestionnairePage() {
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>()
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnswersDialogOpen, setIsAnswersDialogOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const lang = params.lang || 'es';

  const allSteps = useMemo(() => [
    { type: 'question', id: 'hasMedicalConditions', icon: HeartPulse, titleKey: 'questionnaireMedicalConditions', descriptionKey: 'questionnaireMedicalConditionsDesc', detailsLabelKey: 'questionnaireMedicalConditionsDetails' },
    { type: 'question', id: 'isTakingMedication', icon: Pill, titleKey: 'questionnaireMedication', descriptionKey: 'questionnaireMedicationDesc', detailsLabelKey: 'questionnaireMedicationDetails' },
    { type: 'question', id: 'hasMentalHealthHistory', icon: Brain, titleKey: 'questionnaireMentalHealth', descriptionKey: 'questionnaireMentalHealthDesc', detailsLabelKey: 'questionnaireMentalHealthDetails' },
    { type: 'question', id: 'hasPreviousExperience', icon: History, titleKey: 'questionnaireExperience', descriptionKey: 'questionnaireExperienceDesc', detailsLabelKey: 'questionnaireExperienceDetails' },
    { type: 'question', id: 'mainIntention', icon: Sprout, titleKey: 'questionnaireIntention', descriptionKey: 'questionnaireIntentionDesc' },
    { type: 'info', id: 'aiGuide', icon: Bot, titleKey: 'aiGuideTitle', descriptionKey: 'aiGuideDescription' },
    { type: 'info', id: 'process', icon: Wind, titleKey: 'preparationProcessTitle', descriptionKey: 'preparationGuideFullSubtitle' },
    { type: 'info', id: 'diet', icon: Leaf, titleKey: 'dietTitle', descriptionKey: 'dietSubtitle' },
    { type: 'info', id: 'mentalPrep', icon: Sparkles, titleKey: 'mentalPrepTitle', descriptionKey: 'mentalPrepSubtitle' },
    { type: 'info', id: 'emotionalHealing', icon: HeartHandshake, titleKey: 'emotionalHealingTitle', descriptionKey: 'emotionalHealingDescription' },
    { type: 'info', id: 'whatToBring', icon: CheckCircle, titleKey: 'whatToBringTitle', descriptionKey: 'whatToBringSubtitle' },
    { type: 'final', id: 'final', icon: PartyPopper, titleKey: 'preparationCompleteTitle', descriptionKey: 'preparationCompleteDescription' }
  ], [i18n.language]);

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
      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile?.language && i18n.language !== profile.language) {
              i18n.changeLanguage(profile.language);
          }
          const savedAnswers = await getQuestionnaire(currentUser.uid);
          
          if (profile?.questionnaireCompleted) {
            setIsCompleted(true);
          }
          if (savedAnswers) {
            form.reset(savedAnswers);
          }
          
          const targetStep = profile?.questionnaireCompleted ? allSteps.length - 1 : (profile?.preparationStep || 0);
          
          if(api) {
            api.scrollTo(targetStep, true);
          }
          setCurrentStep(targetStep);

        } catch (error) { console.error("Error fetching user data:", error); }
        finally { setPageLoading(false); }
      } else {
        const languageToSet = typeof lang === 'string' && lang.startsWith('en') ? 'en' : 'es';
        router.push(`/login?redirect=/artedesanar/${languageToSet}`);
      }
    });
    return () => unsubscribe();
  }, [api, form, router, allSteps, i18n, lang]);


 const goToNextStep = async () => {
    const currentStepInfo = allSteps[currentStep];
    if (currentStepInfo.type === 'question' && !isCompleted) {
        const fieldName = currentStepInfo.id as keyof FormData;
        
        const fieldsToValidate: (keyof FormData)[] = [fieldName];
        if (form.getValues(fieldName) === 'yes') {
            const detailsFieldName = fieldName.replace(/has|is/, '').charAt(0).toLowerCase() + fieldName.replace(/has|is/, '').slice(1) + 'Details' as keyof FormData;
            fieldsToValidate.push(detailsFieldName);
        }
        
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
        if (api?.canScrollNext()) api.scrollNext();
        return;
    };
    
    const isFinalQuestionValid = await form.trigger('mainIntention');
    if (!isFinalQuestionValid) {
        toast({ title: t('pleaseCompleteThisStep'), variant: 'destructive' });
        return;
    }

    try {
        await saveQuestionnaire(user.uid, form.getValues());
        setIsCompleted(true);
        if (api?.canScrollNext()) api.scrollNext();
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
    if (step.id === 'aiGuide') {
      return (
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
            <EditableTitle tag="p" id="aiGuideContent" initialValue={t('aiGuideContent')} className="text-muted-foreground" />
            <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild><Link href="/courses"><BookOpen className="mr-2 h-4 w-4" />{t('viewCourses')}</Link></Button>
                <Button asChild variant="outline"><Link href="/chats"><Bot className="mr-2 h-4 w-4" />{t('talkToGuide')}</Link></Button>
            </div>
        </div>
      )
    }
    if (step.id === 'process') {
      const processSteps = [
          { id: "preparationProcess", titleId: "preparationProcessTitle", descriptionId: "preparationProcessDescription", Icon: Sprout },
          { id: "ceremonyProcess", titleId: "ceremonyProcessTitle", descriptionId: "ceremonyProcessDescription", Icon: Sparkles },
          { id: "experienceProcess", titleId: "experienceProcessTitle", descriptionId: "experienceProcessDescription", Icon: Wind },
          { id: "integrationProcess", titleId: "integrationProcessTitle", descriptionId: "integrationProcessDescription", Icon: HeartHandshake },
      ];
       return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
              {processSteps.map(({ id, titleId, descriptionId, Icon }) => (
                  <div key={id} className="flex flex-col items-center text-center gap-1 p-1">
                      <div className="p-2 bg-primary/10 rounded-full"><Icon className="h-6 w-6 text-primary" /></div>
                      <EditableTitle tag="h3" id={titleId} initialValue={t(titleId)} className="text-sm font-bold" />
                      <EditableTitle tag="p" id={descriptionId} initialValue={t(descriptionId)} className="text-xs text-muted-foreground" />
                  </div>
              ))}
          </div>
      );
    }
    if (step.id === 'emotionalHealing') {
        return (
             <div className="text-center max-w-sm">
                <EditableTitle tag="h3" id="emotionalHealingTitle" initialValue={t('emotionalHealingTitle')} className="font-bold text-xl mb-2" />
                <EditableTitle tag="p" id="emotionalHealingDescription" initialValue={t('emotionalHealingDescription')} className="text-muted-foreground" />
            </div>
        )
    }
    if (step.id === 'whatToBring') {
      return (
        <div className="grid grid-cols-1 gap-6 text-left text-sm max-w-xs">
          <div>
            <EditableTitle tag="h3" id="comfortItemsTitle" initialValue={t('comfortItemsTitle')} className="font-bold mb-2 text-primary text-center" />
            <EditableTitle tag="p" id="comfortItemsList" initialValue={t('comfortItemsList')} className="list-disc list-inside space-y-1 text-muted-foreground" />
          </div>
          <div>
            <EditableTitle tag="h3" id="essentialsTitle" initialValue={t('essentialsTitle')} className="font-bold mb-2 text-primary text-center" />
            <EditableTitle tag="p" id="essentialsList" initialValue={t('essentialsList')} className="list-disc list-inside space-y-1 text-muted-foreground" />
          </div>
        </div>
      )
    }
    if (step.id === 'diet') {
        return (
            <div className="grid md:grid-cols-2 gap-4 max-w-sm text-left">
                <Card className="bg-green-950/20 border-green-500/30 p-4">
                    <CardHeader className="p-1">
                        <CardTitle className="flex items-center gap-2 text-green-400 text-base">
                            <Leaf className="h-4 w-4"/>
                            <EditableTitle tag="p" id="allowedFoodsTitle" initialValue={t('allowedFoodsTitle')} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 text-xs">
                        <EditableTitle tag="p" id="allowedFoodsList" initialValue={t('allowedFoodsList')} className="space-y-1 text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card className="bg-red-950/20 border-red-500/30 p-4">
                    <CardHeader className="p-1">
                        <CardTitle className="flex items-center gap-2 text-red-400 text-base">
                            <Minus className="h-4 w-4"/>
                            <EditableTitle tag="p" id="prohibitedFoodsTitle" initialValue={t('prohibitedFoodsTitle')} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 text-xs">
                        <EditableTitle tag="p" id="prohibitedFoodsList" initialValue={t('prohibitedFoodsList')} className="space-y-1 text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        )
    }
    if (step.id === 'mentalPrep') {
        const mentalPrepSteps = [
            { titleId: "meditationTitle", descriptionId: "meditationDescription" },
            { titleId: "intentionsTitle", descriptionId: "intentionsDescription" },
            { titleId: "reflectionTitle", descriptionId: "reflectionDescription" },
        ];
        return (
            <div className="grid md:grid-cols-3 gap-2 max-w-5xl mx-auto">
                {mentalPrepSteps.map(item => (
                    <Card key={item.titleId} className="p-2 text-center bg-transparent border-none shadow-none">
                        <EditableTitle tag="h3" id={item.titleId} initialValue={t(item.titleId)} className="font-bold text-base mb-1" />
                        <EditableTitle tag="p" id={item.descriptionId} initialValue={t(item.descriptionId)} className="text-muted-foreground text-xs" />
                    </Card>
                ))}
            </div>
        )
    }
    return <div className="text-center">{t(step.descriptionKey)}</div>;
  }

  if (pageLoading) {
    return <div className="container py-12 md:py-16"><div className="mx-auto max-w-md"><Skeleton className="h-[70vh] w-full rounded-2xl" /></div></div>;
  }
  
  if (!user && !pageLoading) {
    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader><CardTitle>{t('authRequiredJourneyTitle')}</CardTitle><CardDescription>{t('authRequiredJourneyDescription')}</CardDescription></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button asChild className="w-full"><Link href={`/login?redirect=/artedesanar/${lang}`}>{t('signIn')}</Link></Button>
                    <Button asChild variant="secondary" className="w-full"><Link href={`/register?redirect=/artedesanar/${lang}`}>{t('registerButton')}</Link></Button>
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
                <Carousel setApi={setApi} className="w-full" opts={{ watchDrag: false, duration: 20, startIndex: currentStep }} key={i18n.language}>
                    <CarouselContent>
                    {allSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isFinalQuestion = step.id === 'mainIntention';
                        const isFinalScreen = step.type === 'final';
                        const canGoBack = api?.canScrollPrev();
                        const canGoForward = api?.canScrollNext();

                        return(
                            <CarouselItem key={step.id}>
                                <div className="p-6">
                                    <div className="flex flex-col items-center justify-center text-center">
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
                                        
                                        <div className="p-1 w-full min-h-[150px] flex items-center justify-center">
                                            {step.type === 'question' ? getQuestionStepComponent(step) 
                                            : step.type === 'info' ? getInfoStepComponent(step) 
                                            : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Button asChild className="w-full"><Link href="/preparation"><BookOpen className="mr-2 h-4 w-4" />{t('myPreparation')}</Link></Button>
                                                    <Button asChild className="w-full"><Link href="/chats"><Bot className="mr-2 h-4 w-4" />{t('talkToGuide')}</Link></Button>
                                                    <Button asChild variant="outline" className="w-full"><Link href="/courses">{t('viewCourses')}</Link></Button>
                                                    <Button variant="outline" className="w-full" onClick={() => setIsAnswersDialogOpen(true)}>{t('viewMyAnswers')}</Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 flex w-full items-center justify-between">
                                            <Button onClick={goToPrevStep} variant="secondary" disabled={!canGoBack}>{t('previous')}</Button>
                                            
                                            {!isFinalScreen && (
                                                isFinalQuestion ? (
                                                    <Button onClick={onQuestionnaireSubmit} disabled={form.formState.isSubmitting}>{t('finish')}</Button>
                                                ) : (
                                                    <Button onClick={goToNextStep} disabled={!canGoForward}>{t('continue')}</Button>
                                                )
                                            )}
                                        </div>
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
