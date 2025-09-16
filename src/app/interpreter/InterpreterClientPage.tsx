

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// This page is a client component that will handle the redirect and dialog logic.
export default function InterpreterClientPage() {
  const router = useRouter();
  const params = useParams();
  const { i18n } = useTranslation();
  const lang = params.lang || 'es';

  useEffect(() => {
    // For now, it doesn't need to do anything besides rendering,
    // as the logic to open the dialog is now in the dialog component itself.
    // We could potentially add a redirect here if the user navigates away from the dialog.
    const languageToSet = typeof lang === 'string' && lang.startsWith('en') ? 'en' : 'es';
    if (i18n.language !== languageToSet) {
        i18n.changeLanguage(languageToSet);
    }
  }, [router, lang, i18n]);

  return null; // This page doesn't render any visible content.
}

