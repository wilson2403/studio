'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center h-20">
        <p className="text-sm text-muted-foreground">
          {t('footerText', { year })}
        </p>
         <p className="text-xs text-muted-foreground mt-2">
          {t('developedBy')}{' '}
          <Link
            href="https://creatuapp.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Crea tu app (DevAI)
          </Link>
        </p>
      </div>
    </footer>
  );
}
