'use client';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex items-center justify-center h-16">
        <p className="text-sm text-muted-foreground">
          {t('footerText', { year })}
        </p>
      </div>
    </footer>
  );
}
