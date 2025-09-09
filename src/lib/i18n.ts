import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'es'],
    fallbackLng: 'es',
    debug: false,
    backend: {
      loadPath: '/locales/{{lng}}/common.json',
    },
    react: {
      useSuspense: false, // Set to false to avoid Suspense issues with 'use client'
    },
  });

export default i18n;
