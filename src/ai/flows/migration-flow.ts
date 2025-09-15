
'use server';

/**
 * @fileOverview A flow for migrating translation files to Firestore.
 * - migrateContent - Reads local JSON translation files and saves them to the 'content' collection in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { setContent, logError } from '@/lib/firebase/firestore';
import { promises as fs } from 'fs';
import path from 'path';

const MigrationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  processedKeys: z.number(),
  errors: z.array(z.string()),
});

export const migrateContent = ai.defineFlow(
  {
    name: 'migrateContentFlow',
    outputSchema: MigrationOutputSchema,
  },
  async () => {
    let processedKeys = 0;
    const errors: string[] = [];

    try {
      // Define paths to the translation files
      const localesDir = path.join(process.cwd(), 'public/locales');
      const esPath = path.join(localesDir, 'es', 'common.json');
      const enPath = path.join(localesDir, 'en', 'common.json');

      // Read both files
      const esFile = await fs.readFile(esPath, 'utf-8');
      const enFile = await fs.readFile(enPath, 'utf-8');

      const esJson = JSON.parse(esFile);
      const enJson = JSON.parse(enFile);

      // Combine keys from both files to ensure all are processed
      const allKeys = [...new Set([...Object.keys(esJson), ...Object.keys(enJson)])];

      for (const key of allKeys) {
        const esValue = esJson[key] || '';
        const enValue = enJson[key] || '';

        // Only process if at least one language has a value
        if (esValue || enValue) {
          try {
            const contentData = {
              id: key,
              value: { es: esValue, en: enValue },
              type: 'text' as const,
              visible: true,
              page: 'general' // Assign a default page/group
            };
            await setContent(key, contentData);
            processedKeys++;
          } catch (e: any) {
            const errorMessage = `Failed to process key "${key}": ${e.message}`;
            console.error(errorMessage);
            errors.push(errorMessage);
          }
        }
      }
      
      if (errors.length > 0) {
          return {
              success: false,
              message: `Migration completed with ${errors.length} errors.`,
              processedKeys,
              errors,
          };
      }

      return {
        success: true,
        message: `Successfully migrated ${processedKeys} keys to Firestore.`,
        processedKeys,
        errors: [],
      };

    } catch (error: any) {
      console.error('Migration failed:', error);
      await logError(error, { function: 'migrateContent' });
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        processedKeys: 0,
        errors: [error.message],
      };
    }
  }
);
