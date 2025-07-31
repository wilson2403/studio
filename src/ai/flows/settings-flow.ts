
'use server';
/**
 * @fileOverview A flow for managing system settings.
 * - getSystemSettings: Retrieves all critical system settings.
 * - updateSystemSettings: Updates system settings in .env and Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getContent, setContent, logError } from '@/lib/firebase/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import { SystemSettings, EnvironmentSettings } from '@/types';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const navLinkSchema = z.object({
  es: z.string(),
  en: z.string(),
  visible: z.boolean(),
});

const homeButtonSchema = z.object({
    es: z.string(),
    en: z.string(),
});

const componentButtonSchema = z.object({
    es: z.string(),
    en: z.string(),
});

const settingsSchema = z.object({
    logoUrl: z.string().url('Debe ser una URL válida.'),
    whatsappCommunityLink: z.string().url('Debe ser una URL válida.'),
    instagramUrl: z.string().url('Debe ser una URL válida.'),
    facebookUrl: z.string().url('Debe ser una URL válida.'),
    tiktokUrl: z.string().url('Debe ser una URL válida.'),
    whatsappNumber: z.string().min(8, 'Debe ser un número de teléfono válido.'),
    navLinks: z.object({
        home: navLinkSchema,
        medicine: navLinkSchema,
        guides: navLinkSchema,
        testimonials: navLinkSchema,
        ceremonies: navLinkSchema,
        journey: navLinkSchema,
        preparation: navLinkSchema,
    }),
    homeButtons: z.object({
        medicine: homeButtonSchema,
        guides: homeButtonSchema,
        preparation: homeButtonSchema,
    }),
    componentButtons: z.object({
        addCeremony: componentButtonSchema,
        buttonViewDetails: componentButtonSchema,
        whatsappCommunityButton: componentButtonSchema,
        downloadVideo: componentButtonSchema,
        leaveTestimonial: componentButtonSchema,
        shareCeremony: componentButtonSchema,
    }),
});

const environmentSchema = z.object({
    firebaseConfig: z.object({
        apiKey: z.string(),
        authDomain: z.string(),
        projectId: z.string(),
        storageBucket: z.string(),
        messagingSenderId: z.string(),
        appId: z.string(),
    }),
    googleApiKey: z.string(),
    resendApiKey: z.string(),
});

export const getSystemSettings = ai.defineFlow(
  {
    name: 'getSystemSettingsFlow',
    outputSchema: settingsSchema,
  },
  async () => {
    try {
      const fetchStringContent = async (id: string, fallback: string) => {
          const content = await getContent(id) as string | { es: string, en: string } | null;
          if (typeof content === 'object' && content !== null) {
              return content.es || fallback;
          }
          return content || fallback;
      }
      
      const fetchContentWithFallback = async (id: string, fallback: {es: string, en: string, visible: boolean}) => {
          const content = await getContent(id) as {es: string, en: string, visible: boolean} | null;
          if (content && typeof content.visible === 'undefined') {
              content.visible = fallback.visible;
          }
          return content || fallback;
      }
      
       const fetchHomeButtonContent = async (id: string, fallback: {es: string, en: string}) => {
          const content = await getContent(id) as {es: string, en: string} | null;
          return content || fallback;
      }

      const fetchComponentButtonContent = async (id: string, fallback: {es: string, en: string}) => {
          const content = await getContent(id) as {es: string, en: string} | null;
          return content || fallback;
      }

      const navLinks = {
          home: await fetchContentWithFallback('navHome', { es: 'Inicio', en: 'Home', visible: true }),
          medicine: await fetchContentWithFallback('navMedicine', { es: 'Medicina', en: 'Medicine', visible: true }),
          guides: await fetchContentWithFallback('navGuides', { es: 'Guías', en: 'Guides', visible: true }),
          testimonials: await fetchContentWithFallback('navTestimonials', { es: 'Testimonios', en: 'Testimonials', visible: true }),
          ceremonies: await fetchContentWithFallback('navCeremonies', { es: 'Ceremonias', en: 'Ceremonies', visible: true }),
          journey: await fetchContentWithFallback('navJourney', { es: 'Iniciar mi Viaje', en: 'Start my Journey', visible: true }),
          preparation: await fetchContentWithFallback('navPreparation', { es: 'Preparación', en: 'Preparation', visible: true }),
      };

      const homeButtons = {
          medicine: await fetchHomeButtonContent('homeButtonMedicine', { es: 'Conocer la Medicina', en: 'Know the Medicine' }),
          guides: await fetchHomeButtonContent('homeButtonGuides', { es: 'Conocer los Guías', en: 'Meet the Guides' }),
          preparation: await fetchHomeButtonContent('homeButtonPreparation', { es: 'Iniciar Preparación', en: 'Start Preparation' }),
      };

      const componentButtons = {
          addCeremony: await fetchComponentButtonContent('componentButtonAddCeremony', { es: 'Agregar Ceremonia', en: 'Add Ceremony' }),
          buttonViewDetails: await fetchComponentButtonContent('componentButtonViewDetails', { es: 'Ver Detalles', en: 'View Details' }),
          whatsappCommunityButton: await fetchComponentButtonContent('componentButtonWhatsappCommunityButton', { es: 'Unirse a la Comunidad', en: 'Join the Community' }),
          downloadVideo: await fetchComponentButtonContent('downloadVideo', { es: 'Descargar Video', en: 'Download Video' }),
          leaveTestimonial: await fetchComponentButtonContent('leaveTestimonial', { es: 'Dejar Testimonio', en: 'Leave Testimonial' }),
          shareCeremony: await fetchComponentButtonContent('shareCeremony', { es: 'Compartir Ceremonia', en: 'Share Ceremony' }),
      };


      return {
        logoUrl: await fetchStringContent('logoUrl', 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg'),
        whatsappCommunityLink: await fetchStringContent('whatsappCommunityLink', 'https://chat.whatsapp.com/BC9bfrXVZdYL0kti2Ox1bQ'),
        instagramUrl: await fetchStringContent('instagramUrl', 'https://www.instagram.com/elartedesanarcr'),
        facebookUrl: await fetchStringContent('facebookUrl', 'https://www.facebook.com/profile.php?id=61574627625274'),
        tiktokUrl: await fetchStringContent('tiktokUrl', 'https://www.tiktok.com/@elartedesanarcr'),
        whatsappNumber: await fetchStringContent('whatsappNumber', '50687992560'),
        navLinks: navLinks,
        homeButtons: homeButtons,
        componentButtons: componentButtons,
      };
    } catch (error: any) {
      logError(error, { function: 'getSystemSettings' });
      throw new Error(`Failed to get system settings: ${error.message}`);
    }
  }
);


export const updateSystemSettings = ai.defineFlow(
  {
    name: 'updateSystemSettingsFlow',
    inputSchema: settingsSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (settings) => {
    try {
        await setContent('logoUrl', { es: settings.logoUrl, en: settings.logoUrl });
        await setContent('whatsappCommunityLink', { es: settings.whatsappCommunityLink, en: settings.whatsappCommunityLink });
        await setContent('instagramUrl', { es: settings.instagramUrl, en: settings.instagramUrl });
        await setContent('facebookUrl', { es: settings.facebookUrl, en: settings.facebookUrl });
        await setContent('tiktokUrl', { es: settings.tiktokUrl, en: settings.tiktokUrl });
        await setContent('whatsappNumber', { es: settings.whatsappNumber, en: settings.whatsappNumber });

        for (const [key, value] of Object.entries(settings.navLinks)) {
            await setContent(`nav${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        }

        for (const [key, value] of Object.entries(settings.homeButtons)) {
            await setContent(`homeButton${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        }

        for (const [key, value] of Object.entries(settings.componentButtons)) {
            await setContent(`componentButton${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        }

      return { success: true, message: 'Settings updated successfully.' };
    } catch (error: any) {
      logError(error, { function: 'updateSystemSettings' });
      return { success: false, message: `Failed to update settings: ${error.message}` };
    }
  }
);

export const getSystemEnvironment = ai.defineFlow(
    {
        name: 'getSystemEnvironmentFlow',
        outputSchema: environmentSchema,
    },
    async () => {
        try {
            const docRef = doc(db, 'settings', 'environment');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as EnvironmentSettings;
            } else {
                // Return defaults from process.env if not found in Firestore
                return {
                    firebaseConfig: {
                        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
                        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
                        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
                        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
                        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
                    },
                    googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
                    resendApiKey: process.env.RESEND_API_KEY || '',
                };
            }
        } catch (error: any) {
            logError(error, { function: 'getSystemEnvironment' });
            throw new Error(`Failed to get system environment: ${error.message}`);
        }
    }
);

export const updateSystemEnvironment = ai.defineFlow(
    {
        name: 'updateSystemEnvironmentFlow',
        inputSchema: environmentSchema,
        outputSchema: z.object({ success: z.boolean(), message: z.string() }),
    },
    async (settings) => {
        try {
            const docRef = doc(db, 'settings', 'environment');
            await setDoc(docRef, settings, { merge: true });
            return { success: true, message: 'Environment settings updated successfully.' };
        } catch (error: any) {
            logError(error, { function: 'updateSystemEnvironment' });
            return { success: false, message: `Failed to update environment settings: ${error.message}` };
        }
    }
);
