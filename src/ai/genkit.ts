import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config({ path: `.env` });

const activeEnv = process.env.ACTIVE_FIREBASE_ENV || 'PRODUCTION';

const googleApiKey = activeEnv === 'BACKUP'
  ? process.env.BACKUP_GOOGLE_API_KEY
  : process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey || process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
