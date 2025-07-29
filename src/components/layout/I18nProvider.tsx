
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useEffect, useState } from 'react';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // i18next.init() is now called inside i18n.ts, so we just check for initialization
    if (i18n.isInitialized) {
      setIsInitialized(true);
    } else {
      // If it's not initialized, wait for the 'initialized' event
      i18n.on('initialized', () => {
        setIsInitialized(true);
      });
    }
  }, []);

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
