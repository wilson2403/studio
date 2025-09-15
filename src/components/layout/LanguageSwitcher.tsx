
'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserLanguage } from '@/lib/firebase/firestore';
import { useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { user, userProfile, loading } = useAuth();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    if (user?.uid && userProfile) { // Ensure profile is loaded before saving
        try {
            await updateUserLanguage(user.uid, lng as 'es' | 'en');
        } catch (error) {
            console.error("Failed to save language preference:", error);
        }
    }
    window.location.reload();
  };

  useEffect(() => {
    // When the language changes from the server (e.g. from user profile),
    // this will set it on the client.
    if(userProfile?.language && i18n.language !== userProfile.language) {
      i18n.changeLanguage(userProfile.language);
    }
  }, [userProfile, i18n]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('changeLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)} disabled={loading}>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
