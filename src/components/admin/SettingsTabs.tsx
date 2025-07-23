
'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, Palette, History } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';


export default function SettingsTabs({ user }: { user: User }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs defaultValue={pathname.replace('/admin', '') || '/'} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="/" onClick={() => router.push('/admin')}><UserIcon className="mr-2 h-4 w-4"/>{t('profileTab')}</TabsTrigger>
        <TabsTrigger value="/theme" onClick={() => router.push('/admin/theme')}><Palette className="mr-2 h-4 w-4"/>{t('themeTab')}</TabsTrigger>
        <TabsTrigger value="/backup" onClick={() => router.push('/admin/backup')}><History className="mr-2 h-4 w-4"/>{t('backupTab')}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
