
'use server';

/**
 * @fileOverview A flow for transcribing audio to text.
 * - transcribeAudio - Transcribes an audio data URI.
 * - AudioInput - The input type for the transcribeAudio function.
 * - TranscriptionOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AudioInputSchema = z.string().describe("The audio file to transcribe, as a data URI.");
export type AudioInput = z.infer<typeof AudioInputSchema>;

const TranscriptionOutputSchema = z.object({
  transcription: z.string().describe("The transcribed text."),
});
export type TranscriptionOutput = z.infer<typeof TranscriptionOutputSchema>;

const transcriptionPrompt = ai.definePrompt({
    name: 'transcriptionPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: z.object({ audioDataUri: z.string() }) },
    output: { schema: TranscriptionOutputSchema },
    prompt: `Transcribe el siguiente audio. Responde únicamente con el texto transcrito.

Audio: {{media url=audioDataUri}}`,
});

export const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: AudioInputSchema,
    outputSchema: TranscriptionOutputSchema,
  },
  async (audioDataUri) => {
    const { output } = await transcriptionPrompt({ audioDataUri });
    if (!output) {
      throw new Error("Failed to transcribe audio.");
    }
    return output;
  }
);

export async function transcribeAudio(audioDataUri: AudioInput): Promise<TranscriptionOutput> {
    return transcribeAudioFlow(audioDataUri);
}
