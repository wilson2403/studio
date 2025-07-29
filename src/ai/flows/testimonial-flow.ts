
'use server';

/**
 * @fileOverview A flow for generating a testimonial from keywords.
 * - generateTestimonial - Generates a testimonial.
 * - TestimonialInput - The input type for the generateTestimonial function.
 * - TestimonialOutput - The return type for the generateTestimonial function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TestimonialInputSchema = z.string().describe("Keywords to generate the testimonial from, separated by commas.");
export type TestimonialInput = z.infer<typeof TestimonialInputSchema>;

const TestimonialOutputSchema = z.object({
  testimonial: z.string().describe("The generated testimonial text."),
});
export type TestimonialOutput = z.infer<typeof TestimonialOutputSchema>;

const testimonialPrompt = ai.definePrompt({
    name: 'testimonialPrompt',
    input: { schema: z.string() },
    output: { schema: TestimonialOutputSchema },
    prompt: `You are an AI assistant for "El Arte de Sanar", a spiritual healing center. Your task is to write a heartfelt, positive, and concise testimonial based on the keywords provided by a user. The testimonial should sound authentic and reflect a transformative experience.

The tone should be:
- Grateful and sincere.
- Reflective and personal.
- Inspiring for others who might be considering a ceremony.

Keywords provided by the user:
{{{input}}}

Based on these keywords, generate a testimonial of about 2-4 sentences. Address the experience in first person ("mi experiencia fue...", "me sentí...").

Example:
Keywords: "conexión, paz, guía increíble, seguro"
Generated Testimonial: "Mi experiencia en El Arte de Sanar fue profundamente transformadora. Encontré una paz y una conexión que no sabía que era posible. Me sentí completamente seguro y apoyado por los guías durante todo el proceso. Lo recomiendo de corazón a cualquiera que busque sanación."

Generated Testimonial:`,
});

export const generateTestimonialFlow = ai.defineFlow(
  {
    name: 'generateTestimonialFlow',
    inputSchema: TestimonialInputSchema,
    outputSchema: TestimonialOutputSchema,
  },
  async (input) => {
    const { output } = await testimonialPrompt(input);
    if (!output) {
      throw new Error("Failed to generate testimonial.");
    }
    return output;
  }
);

export async function generateTestimonial(keywords: TestimonialInput): Promise<TestimonialOutput> {
    return generateTestimonialFlow(keywords);
}
