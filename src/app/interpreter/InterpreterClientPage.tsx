

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// This page is a client component that will handle the redirect and dialog logic.
export default function InterpreterClientPage() {
  const router = useRouter();
  const { i18n } = useTranslation();

  useEffect(() => {
    // For now, it doesn't need to do anything besides rendering,
    // as the logic to open the dialog is now in the dialog component itself.
  }, [router, i18n]);

  return null; // This page doesn't render any visible content.
}
