
'use server';

/**
 * @fileOverview A flow for interpreting dreams and experiences.
 * - interpretDreamAndGetRecommendations: Interprets a dream, provides recommendations, and saves the entry.
 * - DreamInterpretationInput: The input type for the flow.
 * - DreamInterpretationOutput: The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { saveDreamEntry, DreamEntry } from '@/lib/firebase/firestore';

const DreamInputSchema = z.object({
  uid: z.string(),
  dream: z.string().describe('The user\'s description of their dream or spiritual experience.'),
  history: z.array(z.object({
    dream: z.string(),
    interpretation: z.string(),
    recommendations: z.object({
        personal: z.string().optional(),
        lucidDreaming: z.array(z.string()).optional(),
    }).optional()
  })).describe('The user\'s past dream entries to provide context.')
});

const DreamOutputSchema = z.object({
  interpretation: z.string().describe('A spiritual interpretation of the dream or experience.'),
  recommendations: z.object({
    personal: z.string().describe('Personalized recommendations based on the interpretation.').optional(),
    lucidDreaming: z.array(z.string()).describe('A list of new, unique techniques or tips for lucid dreaming or reality checks that haven\'t been provided before.').optional(),
  }),
});

export type DreamInterpretationInput = z.infer<typeof DreamInputSchema>;
export type DreamInterpretationOutput = z.infer<typeof DreamOutputSchema>;

const dreamInterpretationPrompt = ai.definePrompt({
    name: 'dreamInterpretationPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: DreamInputSchema.omit({ uid: true }) },
    output: { schema: DreamOutputSchema },
    prompt: `Eres un intérprete de sueños y experiencias espirituales. Tu enfoque es chamánico y junguiano. Analiza el siguiente sueño o experiencia y proporciona una interpretación profunda y simbólica.

    **IMPORTANTE: Tu respuesta debe ser siempre en español, sin importar el idioma del sueño.**

    **Contexto del Usuario (Sueños Anteriores):**
    {{#each history}}
    - Sueño: {{{dream}}}
      Interpretación: {{{interpretation}}}
    {{/each}}

    **Nuevo Sueño/Experiencia a Interpretar:**
    {{{dream}}}

    **Tu Tarea:**
    1.  **Interpretación (en español):** Proporciona una interpretación espiritual y simbólica del nuevo sueño. Conecta con los temas recurrentes si los hay en el historial.
    2.  **Recomendaciones Personales (en español):** Basado en la interpretación, ofrece 1 o 2 consejos o preguntas de reflexión para que el usuario integre el mensaje del sueño en su vida.
    3.  **Recomendaciones de Sueño Lúcido (en español):** Ofrece 1 o 2 técnicas **nuevas y únicas** para practicar sueños lúcidos o realizar "chequeos de realidad". No repitas consejos que ya se hayan dado en el historial. Ejemplos de técnicas: contar los dedos de la mano, intentar respirar con la nariz tapada, mirar un texto, apartar la vista y volver a mirarlo. Sé creativo y ofrece variedad en cada interpretación.
    `,
});

async function runDreamInterpretationFlow(input: DreamInterpretationInput): Promise<DreamInterpretationOutput> {
    const { uid, dream, history } = input;
    
    const { output } = await dreamInterpretationPrompt({ dream, history });

    if (!output) {
        throw new Error('Failed to get interpretation from AI.');
    }

    const newEntry: DreamEntry = {
        date: new Date(),
        dream: dream,
        interpretation: output.interpretation,
        recommendations: output.recommendations,
    };

    try {
        await saveDreamEntry(uid, newEntry);
    } catch (error) {
        console.error("Failed to save dream entry:", error);
        // Do not rethrow, as we still want to return the interpretation to the user.
    }

    return output;
}

export const interpretDreamAndGetRecommendations = ai.defineFlow(
  {
    name: 'dreamInterpretationFlow',
    inputSchema: DreamInputSchema,
    outputSchema: DreamOutputSchema,
  },
  runDreamInterpretationFlow
);
