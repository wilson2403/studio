
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
import { SystemSettings } from '@/types';

const navLinkSchema = z.object({
  es: z.string(),
  en: z.string(),
});

const settingsSchema = z.object({
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
    whatsappCommunityLink: z.string(),
    navLinks: z.object({
        home: navLinkSchema,
        medicine: navLinkSchema,
        guides: navLinkSchema,
        ceremonies: navLinkSchema,
        preparation: navLinkSchema,
    }),
});

export const getSystemSettings = ai.defineFlow(
  {
    name: 'getSystemSettingsFlow',
    outputSchema: settingsSchema,
  },
  async () => {
    try {
      const fetchContentWithFallback = async (id: string, fallback: {es: string, en: string}) => {
          const content = await getContent(id) as {es: string, en: string} | null;
          return content || fallback;
      }
      
      const whatsappLinkContent = await getContent('whatsappCommunityLink');
      const whatsappLink = (typeof whatsappLinkContent === 'object' && whatsappLinkContent !== null ? (whatsappLinkContent as any).es : whatsappLinkContent) as string || '';

      const navLinks = {
          home: await fetchContentWithFallback('navHome', { es: 'Inicio', en: 'Home' }),
          medicine: await fetchContentWithFallback('navMedicine', { es: 'Medicina', en: 'Medicine' }),
          guides: await fetchContentWithFallback('navGuides', { es: 'Guías', en: 'Guides' }),
          ceremonies: await fetchContentWithFallback('navCeremonies', { es: 'Ceremonias', en: 'Ceremonies' }),
          preparation: await fetchContentWithFallback('navPreparation', { es: 'Preparación', en: 'Preparation' }),
      };

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
        whatsappCommunityLink: whatsappLink,
        navLinks: navLinks,
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
        // Update .env file
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = '';
        try {
            envContent = await fs.readFile(envPath, 'utf-8');
        } catch (e) {
            // File might not exist, that's okay
        }

        const updateEnvVar = (content: string, key: string, value: string) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(content)) {
                return content.replace(regex, `${key}="${value}"`);
            } else {
                return content + `\n${key}="${value}"`;
            }
        };

        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_FIREBASE_API_KEY', settings.firebaseConfig.apiKey);
        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', settings.firebaseConfig.authDomain);
        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', settings.firebaseConfig.projectId);
        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', settings.firebaseConfig.storageBucket);
        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', settings.firebaseConfig.messagingSenderId);
        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_FIREBASE_APP_ID', settings.firebaseConfig.appId);
        envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_GOOGLE_API_KEY', settings.googleApiKey);
        envContent = updateEnvVar(envContent, 'RESEND_API_KEY', settings.resendApiKey);

        await fs.writeFile(envPath, envContent.trim());
      
        // Update Firestore content
        await setContent('whatsappCommunityLink', { es: settings.whatsappCommunityLink, en: settings.whatsappCommunityLink });
        for (const [key, value] of Object.entries(settings.navLinks)) {
            await setContent(`nav${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        }

      return { success: true, message: 'Settings updated successfully.' };
    } catch (error: any) {
      logError(error, { function: 'updateSystemSettings' });
      return { success: false, message: `Failed to update settings: ${error.message}` };
    }
  }
);
