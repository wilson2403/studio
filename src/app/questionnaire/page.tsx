
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getQuestionnaire, saveQuestionnaire, QuestionnaireAnswers, getUserProfile, updatePreparationProgress } from '@/lib/firebase/firestore';
import { ArrowLeft, ArrowRight, PartyPopper, HeartHandshake, Leaf, Minus, Sparkles, Sprout, Wind, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Progress } from '@/components/ui/progress';
import ViewAnswersDialog from '@/components/questionnaire/ViewAnswersDialog';
import { EditableProvider } from '@/components/home/EditableProvider';
import { EditableTitle } from '@/components/home/EditableTitle';

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

export default function PreparationGuidePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>()
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(1)
  const [isAnswersDialogOpen, setIsAnswersDialogOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(questionnaireSchema(t)),
    mode: 'onChange',
  });

  const processSteps = [
      { id: "preparationProcess", titleId: "preparationProcessTitle", descriptionId: "preparationProcessDescription", Icon: Sprout },
      { id: "ceremonyProcess", titleId: "ceremonyProcessTitle", descriptionId: "ceremonyProcessDescription", Icon: Sparkles },
      { id: "experienceProcess", titleId: "experienceProcessTitle", descriptionId: "experienceProcessDescription", Icon: Wind },
      { id: "integrationProcess", titleId: "integrationProcessTitle", descriptionId: "integrationProcessDescription", Icon: HeartHandshake },
  ];
  const mentalPrepSteps = [
      { titleId: "meditationTitle", descriptionId: "meditationDescription" },
      { titleId: "intentionsTitle", descriptionId: "intentionsDescription" },
      { titleId: "reflectionTitle", descriptionId: "reflectionDescription" },
  ];
  
  const allSteps = [
    { type: 'question', id: 'hasMedicalConditions' },
    { type: 'question', id: 'isTakingMedication' },
    { type: 'question', id: 'hasMentalHealthHistory' },
    { type: 'question', id: 'hasPreviousExperience' },
    { type: 'question', id: 'mainIntention' },
    { type: 'info', id: 'process', content: processSteps },
    { type: 'info', id: 'diet', content: null },
    { type: 'info', id: 'mentalPrep', content: mentalPrepSteps },
    { type: 'info', id: 'emotionalHealing', content: null },
    { type: 'info', id: 'whatToBring', content: null },
    { type: 'final', id: 'final' }
  ];

  const updateUserProgress = useCallback(async (step: number) => {
    if (user && !isCompleted) {
      await updatePreparationProgress(user.uid, step);
    }
  }, [user, isCompleted]);

  useEffect(() => {
    if (!api) return;

    setTotalSteps(api.scrollSnapList().length);
    
    const handleSelect = () => {
      const newStep = api.selectedScrollSnap();
      setCurrentStep(newStep);
      updateUserProgress(newStep);
    };
    
    api.on("select", handleSelect);
    
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, updateUserProgress]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          const savedAnswers = await getQuestionnaire(currentUser.uid);
          
          if (profile?.questionnaireCompleted) {
            setIsCompleted(true);
          }

          if (savedAnswers) {
            form.reset(savedAnswers);
          }
          if (api) {
            const targetStep = profile?.questionnaireCompleted ? allSteps.length - 1 : (profile?.preparationStep || 0);
            api.scrollTo(targetStep, true);
          }

        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [api, form]);

  const goToNextStep = async () => {
    const isQuestionStep = allSteps[currentStep].type === 'question';
    if (isQuestionStep && !isCompleted) {
        const questionId = allSteps[currentStep].id as keyof FormData;
        const isValid = await form.trigger(questionId);
        if (!isValid) return;
    }

    if (api?.canScrollNext()) {
      api.scrollNext();
    }
  };
  
  const goToPrevStep = () => {
      if(api?.canScrollPrev()) {
          api.scrollPrev();
      }
  }

  const onQuestionnaireSubmit = async () => {
    if (!user || isCompleted) {
        goToNextStep();
        return;
    };
    try {
        await saveQuestionnaire(user.uid, form.getValues());
        setIsCompleted(true);
        goToNextStep();
    } catch (error) {
        toast({
            title: t('questionnaireErrorTitle'),
            description: t('questionnaireErrorDescription'),
            variant: 'destructive',
        });
    }
  };

  const renderReadOnlyAnswer = (label: string, value?: string, details?: string) => {
    if (value === undefined && details === undefined) return null;

    let displayValue: React.ReactNode;
    if (value) {
        displayValue = <span className={`font-medium ${value === 'yes' ? 'text-destructive' : 'text-primary'}`}>{t(value)}</span>;
    } else {
        displayValue = <p className="mt-1 text-sm whitespace-pre-wrap">{details || t('noDetailsProvided')}</p>;
    }
    return (
        <div className="space-y-2">
            <h3 className="text-xl font-semibold">{label}</h3>
            <div className="text-muted-foreground">{displayValue}</div>
             {value && details && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{details}</p>}
        </div>
    );
  };

  const renderRadioGroup = (name: keyof FormData, label: string) => {
      const fieldName = name as "hasMedicalConditions" | "isTakingMedication" | "hasMentalHealthHistory" | "hasPreviousExperience";
      const profile = form.getValues();
      const isReadOnly = isCompleted || currentStep < (profile.preparationStep || 0);

      if (isReadOnly) {
        return renderReadOnlyAnswer(label, form.getValues(fieldName), form.getValues((fieldName.replace('has', 'details').replace('is', 'details') + 'Details') as keyof FormData));
      }

      return (
         <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-xl">{label}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="yes" /></FormControl>
                    <FormLabel className="font-normal">{t('yes')}</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="no" /></FormControl>
                    <FormLabel className="font-normal">{t('no')}</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
  }

  const renderDetailsField = (name: keyof FormData, conditionName: keyof FormData, label: string) => {
      const detailsFieldName = name as "medicalConditionsDetails" | "medicationDetails" | "mentalHealthDetails" | "previousExperienceDetails";
      const conditionFieldName = conditionName as "hasMedicalConditions" | "isTakingMedication" | "hasMentalHealthHistory" | "hasPreviousExperience";
      const profile = form.getValues();
      const isReadOnly = isCompleted || currentStep < (profile.preparationStep || 0);
      
      if (form.watch(conditionFieldName) === 'yes' && !isReadOnly) {
          return (
             <FormField
                control={form.control}
                name={detailsFieldName}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>{label}</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          )
      }
      return null;
  }
  
  const getQuestionStepComponent = (id: string) => {
    switch(id) {
      case 'hasMedicalConditions':
        return <div>{renderRadioGroup('hasMedicalConditions', t('questionnaireMedicalConditions'))}{renderDetailsField('medicalConditionsDetails', 'hasMedicalConditions', t('questionnaireMedicalConditionsDetails'))}</div>;
      case 'isTakingMedication':
        return <div>{renderRadioGroup('isTakingMedication', t('questionnaireMedication'))}{renderDetailsField('medicationDetails', 'isTakingMedication', t('questionnaireMedicationDetails'))}</div>;
      case 'hasMentalHealthHistory':
        return <div>{renderRadioGroup('hasMentalHealthHistory', t('questionnaireMentalHealth'))}{renderDetailsField('mentalHealthDetails', 'hasMentalHealthHistory', t('questionnaireMentalHealthDetails'))}</div>;
      case 'hasPreviousExperience':
        return <div>{renderRadioGroup('hasPreviousExperience', t('questionnaireExperience'))}{renderDetailsField('previousExperienceDetails', 'hasPreviousExperience', t('questionnaireExperienceDetails'))}</div>;
      case 'mainIntention':
        const profile = form.getValues();
        const isReadOnly = isCompleted || currentStep < (profile.preparationStep || 0);

         if (isReadOnly) {
             return renderReadOnlyAnswer(t('questionnaireIntention'), undefined, form.getValues('mainIntention'));
         }
        return <FormField control={form.control} name="mainIntention" render={({ field }) => (
                  <FormItem><FormLabel className="text-xl">{t('questionnaireIntention')}</FormLabel><FormControl><Textarea placeholder={t('questionnaireIntentionPlaceholder')} rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>;
      default: return null;
    }
  }

  if (loading) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                  <CardTitle>{t('authRequiredJourneyTitle')}</CardTitle>
                  <CardDescription>{t('authRequiredJourneyDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button asChild className="w-full">
                        <Link href="/login?redirect=/questionnaire">{t('signIn')}</Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/register?redirect=/questionnaire">{t('registerButton')}</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <EditableProvider>
    <div className="container py-12 md:py-16">
      <Card className="mx-auto max-w-4xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">{t('preparationGuideTitle')}</CardTitle>
          <CardDescription className="font-body">{t('preparationGuideSubtitle')}</CardDescription>
          <Progress value={(currentStep + 1) / totalSteps * 100} className="w-full mt-4" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <Carousel setApi={setApi} className="w-full" opts={{ watchDrag: false, align: "start" }}>
              <CarouselContent>
                {allSteps.map((step, index) => (
                  <CarouselItem key={index} className="min-h-[400px] flex flex-col justify-between p-6">
                    <div className="space-y-6 flex-grow">
                        {step.type === 'question' ? (
                            getQuestionStepComponent(step.id)
                        ) : step.type === 'info' && step.id === 'process' ? (
                        <div>
                            <EditableTitle tag="h2" id="preparationProcessTitle" initialValue={t('preparationProcessTitle')} className="text-2xl font-headline text-primary text-center mb-6" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(step.content as typeof processSteps).map(({ id, titleId, descriptionId, Icon }) => (
                                    <div key={id} className="flex flex-col items-center text-center gap-3 p-4">
                                        <div className="p-3 bg-primary/10 rounded-full"><Icon className="h-8 w-8 text-primary" /></div>
                                        <EditableTitle tag="h3" id={titleId} initialValue={t(titleId)} className="text-xl font-bold" />
                                        <EditableTitle tag="p" id={descriptionId} initialValue={t(descriptionId)} className="text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        ) : step.type === 'info' && step.id === 'diet' ? (
                        <div>
                            <EditableTitle tag="h2" id="dietTitle" initialValue={t('dietTitle')} className="text-2xl font-headline text-primary text-center mb-6" />
                            <EditableTitle tag="p" id="dietSubtitle" initialValue={t('dietSubtitle')} className="text-muted-foreground text-center mb-6" />
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="bg-green-950/20 border-green-500/30 p-4">
                                <CardHeader className="p-2">
                                    <CardTitle className="flex items-center gap-2 text-green-400">
                                        <Leaf/>
                                        <EditableTitle tag="p" id="allowedFoodsTitle" initialValue={t('allowedFoodsTitle')} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                    <EditableTitle tag="p" id="allowedFoodsList" initialValue={t('allowedFoodsList')} />
                                </CardContent>
                                </Card>
                                <Card className="bg-red-950/20 border-red-500/30 p-4">
                                    <CardHeader className="p-2">
                                    <CardTitle className="flex items-center gap-2 text-red-400">
                                        <Minus/>
                                        <EditableTitle tag="p" id="prohibitedFoodsTitle" initialValue={t('prohibitedFoodsTitle')} />
                                    </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-2">
                                    <EditableTitle tag="p" id="prohibitedFoodsList" initialValue={t('prohibitedFoodsList')} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        ) : step.type === 'info' && step.id === 'mentalPrep' ? (
                        <div>
                            <EditableTitle tag="h2" id="mentalPrepTitle" initialValue={t('mentalPrepTitle')} className="text-2xl font-headline text-primary text-center mb-6" />
                            <EditableTitle tag="p" id="mentalPrepSubtitle" initialValue={t('mentalPrepSubtitle')} className="text-muted-foreground text-center mb-6" />
                            <div className="grid md:grid-cols-3 gap-6">
                            {(step.content as typeof mentalPrepSteps).map(item => (
                                <Card key={item.titleId} className="p-4 text-center">
                                    <EditableTitle tag="h3" id={item.titleId} initialValue={t(item.titleId)} className="font-bold text-lg mb-2" />
                                    <EditableTitle tag="p" id={item.descriptionId} initialValue={t(item.descriptionId)} className="text-muted-foreground" />
                                </Card>
                            ))}
                            </div>
                        </div>
                        ) : step.type === 'info' && step.id === 'emotionalHealing' ? (
                        <div className="text-center max-w-2xl mx-auto">
                            <EditableTitle tag="h2" id="emotionalHealingTitle" initialValue={t('emotionalHealingTitle')} className="text-2xl font-headline text-primary mb-4" />
                            <EditableTitle tag="p" id="emotionalHealingDescription" initialValue={t('emotionalHealingDescription')} className="text-muted-foreground" />
                        </div>
                        ) : step.type === 'info' && step.id === 'whatToBring' ? (
                        <div>
                            <EditableTitle tag="h2" id="whatToBringTitle" initialValue={t('whatToBringTitle')} className="text-2xl font-headline text-primary text-center mb-6" />
                            <EditableTitle tag="p" id="whatToBringSubtitle" initialValue={t('whatToBringSubtitle')} className="text-muted-foreground text-center mb-6" />
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <EditableTitle tag="h3" id="comfortItemsTitle" initialValue={t('comfortItemsTitle')} className="font-bold text-lg mb-2" />
                                    <EditableTitle tag="p" id="comfortItemsList" initialValue={t('comfortItemsList')} />
                                </div>
                                <div>
                                    <EditableTitle tag="h3" id="essentialsTitle" initialValue={t('essentialsTitle')} className="font-bold text-lg mb-2" />
                                    <EditableTitle tag="p" id="essentialsList" initialValue={t('essentialsList')} />
                                </div>
                            </div>
                        </div>
                        ) : step.type === 'final' ? (
                        <div className="text-center flex flex-col items-center gap-4">
                                <PartyPopper className="h-16 w-16 text-primary" />
                                <h2 className="text-2xl font-headline text-primary">{t('preparationCompleteTitle')}</h2>
                                <p className="text-muted-foreground max-w-xl">{t('preparationCompleteDescription')}</p>
                                <div className='flex flex-col gap-3 mt-4'>
                                    <Button asChild variant="default" size="lg">
                                        <Link href="/courses">
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            {t('viewCoursesRecommendation')}
                                        </Link>
                                    </Button>
                                    <div className='flex flex-wrap justify-center gap-2'>
                                        <Button asChild><Link href="/">{t('backToHome')}</Link></Button>
                                        <Button asChild variant="outline"><Link href="/preparation">{t('viewPreparationGuide')}</Link></Button>
                                        <Button variant="outline" onClick={() => setIsAnswersDialogOpen(true)}>{t('viewMyAnswers')}</Button>
                                    </div>
                                </div>
                        </div>
                        ) : null}
                    </div>
                    
                    <div className="mt-8 flex justify-between">
                        <Button onClick={goToPrevStep} variant="outline" disabled={!api?.canScrollPrev()}>
                             <ArrowLeft className="mr-2 h-4 w-4" /> {t('previous')}
                        </Button>

                      {allSteps[currentStep].type === 'question' && allSteps[currentStep].id === 'mainIntention' && !isCompleted ? (
                          <Button onClick={onQuestionnaireSubmit} disabled={form.formState.isSubmitting}>
                              {t('saveAndContinue')} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                      ) : allSteps[currentStep].type !== 'final' ? (
                          <Button onClick={goToNextStep} disabled={!api?.canScrollNext()}>
                              {t('continue')} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                      ) : null}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </Form>
        </CardContent>
      </Card>
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

