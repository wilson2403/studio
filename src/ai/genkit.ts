import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config({ path: `.env.local` });

const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("GOOGLE_API_KEY is not defined. Genkit features may not work.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  logLevel: 'warn',
  enableTracing: false,
});
