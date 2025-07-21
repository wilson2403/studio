
'use client';

import { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const TOUR_STORAGE_KEY = 'tour_status'; // "pending", "done"

export default function WelcomeTour() {
  const [run, setRun] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPhoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        const tourStatus = sessionStorage.getItem(TOUR_STORAGE_KEY);
        if (currentUser && tourStatus === 'pending') {
            setPhoneNumberModalOpen(true);
        }
    });
    return () => unsubscribe();
  }, []);

  const handleStartTour = async () => {
    if (user && phoneNumber) {
      try {
        await updateUserProfile(user.uid, { phone: phoneNumber });
        toast({ title: t('tourPhoneNumberSaved') });
      } catch (error) {
        toast({ title: t('error'), description: t('tourPhoneNumberError'), variant: 'destructive' });
      }
    }
    setPhoneNumberModalOpen(false);
    // Delay starting the tour to allow the modal to close and UI to update
    setTimeout(() => {
        setRun(true);
    }, 500);
  };
  
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status) || type === 'tour:end') {
      setRun(false);
      sessionStorage.setItem(TOUR_STORAGE_KEY, 'done');
      // Final step: guide to questionnaire
      router.push('/questionnaire');
    }
  };

  const steps: Step[] = [
    {
      target: '#pastCeremoniesTitle',
      content: t('tourStepPastCeremonies'),
      placement: 'top',
    },
    {
      target: '#ceremonias',
      content: t('tourStepUpcomingCeremonies'),
      placement: 'top',
    },
    {
      target: 'body',
      content: t('tourStepFinal'),
      placement: 'center',
    }
  ];

  if (!user) return null;

  return (
    <>
      <Dialog open={isPhoneNumberModalOpen} onOpenChange={setPhoneNumberModalOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('tourWelcomeTitle', { name: user.displayName })}</DialogTitle>
            <DialogDescription>{t('tourWelcomeDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('tourPhoneNumberLabel')}</Label>
            <Input 
                id="phone" 
                type="tel" 
                placeholder="+506 8888-8888" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />
             <p className="text-xs text-muted-foreground">{t('tourPhoneNumberDescription')}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleStartTour}>{t('tourStartButton')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Joyride
        run={run}
        steps={steps}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        locale={{
            last: t('tourFinish'),
            next: t('next'),
            back: t('back'),
            skip: t('skip')
        }}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--foreground))',
          },
           tooltip: {
                backgroundColor: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
            },
            buttonNext: {
                 backgroundColor: 'hsl(var(--primary))',
            }
        }}
      />
    </>
  );
}
