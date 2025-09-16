'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function InterpreterClientPage({ lang }: { lang?: string }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // This component's purpose is to set the language based on the URL param
    // and then the dialog will be triggered by the pathname in DreamInterpreterDialog.
    const languageToSet = lang === 'en' ? 'en' : 'es';
    if (i18n.language !== languageToSet) {
      i18n.changeLanguage(languageToSet).then(() => {
          // Force a reload to apply the new language resources everywhere
          window.location.reload();
      });
    }
  }, [lang, i18n]);

  return null; // This page doesn't render any visible content.
}
