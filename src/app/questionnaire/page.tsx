
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
import { ArrowRight, Check, HeartHandshake, Leaf, Minus, Sparkles, Sprout, Wind, CheckCircle, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Progress } from '@/components/ui/progress';
import ViewAnswersDialog from '@/components/questionnaire/ViewAnswersDialog';

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

  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(questionnaireSchema(t)),
    mode: 'onChange',
  });

  // Content for the steps
  const processSteps = [
      { id: "preparation", title: "preparationProcessTitle", description: "preparationProcessDescription", Icon: Sprout },
      { id: "ceremony", title: "ceremonyProcessTitle", description: "ceremonyProcessDescription", Icon: Sparkles },
      { id: "experience", title: "experienceProcessTitle", description: "experienceProcessDescription", Icon: Wind },
      { id: "integration", title: "integrationProcessTitle", description: "integrationProcessDescription", Icon: HeartHandshake },
  ];
  const mentalPrepSteps = [
      { title: "meditationTitle", description: "meditationDescription" },
      { title: "intentionsTitle", description: "intentionsDescription" },
      { title: "reflectionTitle", description: "reflectionDescription" },
  ];
  const comfortItems = Array.isArray(t('comfortItemsList', { returnObjects: true })) ? t('comfortItemsList', { returnObjects: true }) as string[] : [];
  const essentialItems = Array.isArray(t('essentialsList', { returnObjects: true })) ? t('essentialsList', { returnObjects: true }) as string[] : [];
  const allowedFoods = Array.isArray(t('allowedFoodsList', { returnObjects: true })) ? t('allowedFoodsList', { returnObjects: true }) as string[] : [];
  const prohibitedFoods = Array.isArray(t('prohibitedFoodsList', { returnObjects: true })) ? t('prohibitedFoodsList', { returnObjects: true }) as string[] : [];
  
  const allSteps = [
    { type: 'question', id: 'hasMedicalConditions' },
    { type: 'question', id: 'isTakingMedication' },
    { type: 'question', id: 'hasMentalHealthHistory' },
    { type: 'question', id: 'hasPreviousExperience' },
    { type: 'question', id: 'mainIntention' },
    { type: 'info', id: 'process', content: processSteps },
    { type: 'info', id: 'diet', content: { allowed: allowedFoods, prohibited: prohibitedFoods } },
    { type: 'info', id: 'mentalPrep', content: mentalPrepSteps },
    { type: 'info', id: 'emotionalHealing', content: null },
    { type: 'info', id: 'whatToBring', content: { comfort: comfortItems, essentials: essentialItems } },
    { type: 'final', id: 'final' }
  ];

  const updateUserProgress = useCallback(async (step: number) => {
    if (user) {
      await updatePreparationProgress(user.uid, step);
    }
  }, [user]);

  useEffect(() => {
    if (!api) return;

    setTotalSteps(api.scrollSnapList().length);
    
    const handleSelect = () => {
      const newStep = api.selectedScrollSnap();
      setCurrentStep(newStep);
      if (newStep > 0) {
        updateUserProgress(newStep);
      }
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
          if (savedAnswers) {
            form.reset(savedAnswers);
          }
          if (api && profile?.preparationStep) {
            api.scrollTo(profile.preparationStep, true);
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
    const questionId = allSteps[currentStep].id as keyof FormData;
    const isValid = await form.trigger(questionId);

    if (isValid && api?.canScrollNext()) {
      api.scrollNext();
    } else if (api?.canScrollNext()) {
      // For info steps
      api.scrollNext();
    }
  };

  const onQuestionnaireSubmit = async () => {
    if (!user) return;
    try {
        await saveQuestionnaire(user.uid, form.getValues());
        goToNextStep();
    } catch (error) {
        toast({
            title: t('questionnaireErrorTitle'),
            description: t('questionnaireErrorDescription'),
            variant: 'destructive',
        });
    }
  };

  const renderRadioGroup = (name: keyof FormData, label: string) => {
      const fieldName = name as "hasMedicalConditions" | "isTakingMedication" | "hasMentalHealthHistory" | "hasPreviousExperience";
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
      
      if (form.watch(conditionFieldName) === 'yes') {
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
                <CardHeader><CardTitle>{t('accessDenied')}</CardTitle><CardDescription>{t('mustBeLoggedIn')}</CardDescription></CardHeader>
                <CardContent><Button asChild><Link href="/login?redirect=/questionnaire">{t('signIn')}</Link></Button></CardContent>
            </Card>
        </div>
    )
  }

  return (
    <>
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
                    {step.type === 'question' ? (
                      <div className="space-y-6">
                        {getQuestionStepComponent(step.id)}
                      </div>
                    ) : step.type === 'info' && step.id === 'process' ? (
                       <div>
                          <h2 className="text-2xl font-headline text-primary text-center mb-6">{t('preparationPageTitle')}</h2>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {(step.content as typeof processSteps).map(({ id, title, description, Icon }) => (
                                  <div key={id} className="flex flex-col items-center text-center gap-3 p-4">
                                      <div className="p-3 bg-primary/10 rounded-full"><Icon className="h-8 w-8 text-primary" /></div>
                                      <h3 className="text-xl font-bold">{t(title)}</h3>
                                      <p className="text-muted-foreground">{t(description)}</p>
                                  </div>
                              ))}
                           </div>
                       </div>
                    ) : step.type === 'info' && step.id === 'diet' ? (
                      <div>
                        <h2 className="text-2xl font-headline text-primary text-center mb-6">{t('dietTitle')}</h2>
                        <p className="text-muted-foreground text-center mb-6">{t('dietSubtitle')}</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-green-950/20 border-green-500/30 p-4"><CardHeader className="p-2"><CardTitle className="flex items-center gap-2 text-green-400"><Leaf/>{t('allowedFoodsTitle')}</CardTitle></CardHeader><CardContent className="p-2"><ul className="space-y-2">{((step.content as any).allowed as string[]).map((item, i) => <li key={i} className="flex gap-2"><Check className="h-5 w-5 text-green-400 mt-0.5 shrink-0"/>{item}</li>)}</ul></CardContent></Card>
                            <Card className="bg-red-950/20 border-red-500/30 p-4"><CardHeader className="p-2"><CardTitle className="flex items-center gap-2 text-red-400"><Minus/>{t('prohibitedFoodsTitle')}</CardTitle></CardHeader><CardContent className="p-2"><ul className="space-y-2">{((step.content as any).prohibited as string[]).map((item, i) => <li key={i} className="flex gap-2"><Minus className="h-5 w-5 text-red-400 mt-0.5 shrink-0"/>{item}</li>)}</ul></CardContent></Card>
                        </div>
                      </div>
                    ) : step.type === 'info' && step.id === 'mentalPrep' ? (
                      <div>
                        <h2 className="text-2xl font-headline text-primary text-center mb-6">{t('mentalPrepTitle')}</h2>
                        <p className="text-muted-foreground text-center mb-6">{t('mentalPrepSubtitle')}</p>
                        <div className="grid md:grid-cols-3 gap-6">
                          {(step.content as typeof mentalPrepSteps).map(item => (<Card key={item.title} className="p-4 text-center"><CardTitle className="font-bold text-lg mb-2">{t(item.title)}</CardTitle><p className="text-muted-foreground">{t(item.description)}</p></Card>))}
                        </div>
                      </div>
                    ) : step.type === 'info' && step.id === 'emotionalHealing' ? (
                       <div className="text-center max-w-2xl mx-auto">
                           <h2 className="text-2xl font-headline text-primary mb-4">{t('emotionalHealingTitle')}</h2>
                           <p className="text-muted-foreground">{t('emotionalHealingDescription')}</p>
                       </div>
                    ) : step.type === 'info' && step.id === 'whatToBring' ? (
                       <div>
                          <h2 className="text-2xl font-headline text-primary text-center mb-6">{t('whatToBringTitle')}</h2>
                          <p className="text-muted-foreground text-center mb-6">{t('whatToBringSubtitle')}</p>
                          <div className="grid md:grid-cols-2 gap-6">
                              <div><h3 className="font-bold text-lg mb-2">{t('comfortItemsTitle')}</h3><ul className="space-y-2">{((step.content as any).comfort as string[]).map((item, i) => <li key={i} className="flex gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0"/>{item}</li>)}</ul></div>
                              <div><h3 className="font-bold text-lg mb-2">{t('essentialsTitle')}</h3><ul className="space-y-2">{((step.content as any).essentials as string[]).map((item, i) => <li key={i} className="flex gap-2"><CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0"/>{item}</li>)}</ul></div>
                          </div>
                       </div>
                    ) : step.type === 'final' ? (
                       <div className="text-center flex flex-col items-center gap-4">
                            <PartyPopper className="h-16 w-16 text-primary" />
                            <h2 className="text-2xl font-headline text-primary">{t('preparationCompleteTitle')}</h2>
                            <p className="text-muted-foreground max-w-xl">{t('preparationCompleteDescription')}</p>
                            <div className='flex flex-wrap justify-center gap-2 mt-4'>
                                <Button asChild><Link href="/">{t('backToHome')}</Link></Button>
                                <Button asChild variant="outline"><Link href="/preparation">{t('viewPreparationGuide')}</Link></Button>
                                <Button variant="outline" onClick={() => setIsAnswersDialogOpen(true)}>{t('viewMyAnswers')}</Button>
                            </div>
                       </div>
                    ) : null}

                    <div className="mt-8 flex justify-end">
                      {allSteps[currentStep].type === 'question' && allSteps[currentStep].id === 'mainIntention' ? (
                          <Button onClick={onQuestionnaireSubmit} disabled={form.formState.isSubmitting}>
                              {t('saveAndContinue')} <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                      ) : allSteps[currentStep].type !== 'final' ? (
                          <Button onClick={goToNextStep}>
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
    </>
  );
}
