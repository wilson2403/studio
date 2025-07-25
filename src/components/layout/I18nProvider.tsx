
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useEffect, useState } from 'react';
import LoadingScreen from './LoadingScreen';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      // The init is already called in i18n.ts, we just need to wait for it.
      // i18n.isInitialized is the key.
      if (i18n.isInitialized) {
        setIsInitialized(true);
      } else {
        i18n.on('initialized', () => {
          setIsInitialized(true);
        });
      }
    };
    init();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

    