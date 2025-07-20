
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';

const STORAGE_KEY = 'registrationPromptDismissed';

export default function RegistrationPromptDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Add a small delay to not be too intrusive
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleRegister = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    router.push('/register');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Sprout className="h-8 w-8 text-primary" />
            </div>
          <DialogTitle className="text-2xl font-headline">{t('promptRegisterTitle')}</DialogTitle>
          <DialogDescription>
            {t('promptRegisterDescription')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button onClick={handleRegister}>{t('promptRegisterButton')}</Button>
          <Button variant="ghost" onClick={handleClose}>{t('promptRegisterLater')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
