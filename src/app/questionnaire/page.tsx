
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getQuestionnaire, saveQuestionnaire, QuestionnaireAnswers, getUserProfile } from '@/lib/firebase/firestore';
import { ArrowRight, Save, Sprout } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const questionnaireSchema = (t: (key: string) => string) => z.object({
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

export default function QuestionnairePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<z.infer<ReturnType<typeof questionnaireSchema>>>({
    resolver: zodResolver(questionnaireSchema(t)),
    defaultValues: {
      medicalConditionsDetails: '',
      medicationDetails: '',
      mentalHealthDetails: '',
      mainIntention: '',
      previousExperienceDetails: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login?redirect=/questionnaire');
      } else {
        setUser(currentUser);
        const profile = await getUserProfile(currentUser.uid);
        const completed = !!profile?.questionnaireCompleted;
        setIsCompleted(completed);

        const answers = await getQuestionnaire(currentUser.uid);
        if (answers) {
          form.reset(answers);
        }
        
        if (completed) {
            form.disable();
        }

        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, form]);

  const onSubmit = async (values: z.infer<ReturnType<typeof questionnaireSchema>>) => {
    if (!user) return;
    try {
      await saveQuestionnaire(user.uid, values);
      toast({
        title: t('questionnaireSuccessTitle'),
        description: t('questionnaireSuccessDescription'),
      });
      setIsSuccessDialogOpen(true);
      setIsCompleted(true);
      form.disable();
    } catch (error) {
      toast({
        title: t('questionnaireErrorTitle'),
        description: t('questionnaireErrorDescription'),
        variant: 'destructive',
      });
    }
  };
  
  const handleGoToPreparation = () => {
    setIsSuccessDialogOpen(false);
    router.push('/preparation');
  }

  const renderDetailsField = (name: keyof QuestionnaireAnswers, conditionName: keyof QuestionnaireAnswers, label: string) => {
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
                    <FormControl>
                      <Textarea {...field} disabled={isCompleted} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          )
      }
      return null;
  }
  
  const renderRadioGroup = (name: keyof QuestionnaireAnswers, label: string) => {
      const fieldName = name as "hasMedicalConditions" | "isTakingMedication" | "hasMentalHealthHistory" | "hasPreviousExperience";
      return (
         <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                  value={field.value}
                  disabled={isCompleted}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">{t('yes')}</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
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

  if (loading) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-full mt-2" />
          <div className="mt-8 space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>{t('accessDenied')}</CardTitle>
                    <CardDescription>{t('mustBeLoggedIn')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login?redirect=/questionnaire">{t('signIn')}</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <>
    <div className="container py-12 md:py-16">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{isCompleted ? t('questionnaireCompletedTitle') : t('questionnaireTitle')}</CardTitle>
          <CardDescription className="font-body">{isCompleted ? t('questionnaireCompletedDescription') : t('questionnaireDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  {renderRadioGroup('hasMedicalConditions', t('questionnaireMedicalConditions'))}
                  {renderDetailsField('medicalConditionsDetails', 'hasMedicalConditions', t('questionnaireMedicalConditionsDetails'))}
                </div>
                <div>
                  {renderRadioGroup('isTakingMedication', t('questionnaireMedication'))}
                  {renderDetailsField('medicationDetails', 'isTakingMedication', t('questionnaireMedicationDetails'))}
                </div>
                <div>
                  {renderRadioGroup('hasMentalHealthHistory', t('questionnaireMentalHealth'))}
                  {renderDetailsField('mentalHealthDetails', 'hasMentalHealthHistory', t('questionnaireMentalHealthDetails'))}
                </div>
                <div>
                    {renderRadioGroup('hasPreviousExperience', t('questionnaireExperience'))}
                    {renderDetailsField('previousExperienceDetails', 'hasPreviousExperience', t('questionnaireExperienceDetails'))}
                </div>
              <FormField
                control={form.control}
                name="mainIntention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('questionnaireIntention')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('questionnaireIntentionPlaceholder')} rows={5} {...field} disabled={isCompleted} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isCompleted ? (
                 <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? t('saving') : t('saveAnswers')}
                 </Button>
              ) : (
                <Button onClick={() => router.push('/preparation')}>
                    {t('dialogSuccessButton')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-headline">{t('dialogSuccessTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogSuccessDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handleGoToPreparation}>
              {t('dialogSuccessButton')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => setIsSuccessDialogOpen(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
