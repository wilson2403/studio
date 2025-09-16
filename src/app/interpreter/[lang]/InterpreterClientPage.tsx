
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// This page is a client component that will handle the redirect and dialog logic.
export default function InterpreterClientPage({ params }: { params: { lang: string }}) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { lang } = params;

  useEffect(() => {
    // For now, it doesn't need to do anything besides rendering,
    // as the logic to open the dialog is now in the dialog component itself.
     if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [router, i18n, lang]);

  return null; // This page doesn't render any visible content.
}

    