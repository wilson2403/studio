'use server';

/**
 * @fileOverview A flow for translating text from one language to another.
 * - translateText - Translates text.
 * - TranslateInput - The input type for the translateText function.
 * - TranslateOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranslateInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  sourceLang: z.string().describe('The source language code (e.g., "es").'),
  targetLang: z.string().describe('The target language code (e.g., "en").'),
});
export type TranslateInput = z.infer<typeof TranslateInputSchema>;

const TranslateOutputSchema = z.object({
  translatedText: z.string(),
});
export type TranslateOutput = z.infer<typeof TranslateOutputSchema>;

const translatePrompt = ai.definePrompt({
    name: 'translatePrompt',
    input: { schema: TranslateInputSchema },
    output: { schema: TranslateOutputSchema },
    prompt: `Translate the following text from {{sourceLang}} to {{targetLang}}. Only return the translated text.

Text to translate:
"{{{text}}}"`,
});

async function runTranslateFlow(input: TranslateInput): Promise<TranslateOutput> {
    const { output } = await translatePrompt(input);
    return {
        translatedText: output?.translatedText || ''
    };
}

export const translateText = ai.defineFlow(
  {
    name: 'translateFlow',
    inputSchema: TranslateInputSchema,
    outputSchema: TranslateOutputSchema,
  },
  runTranslateFlow
);
