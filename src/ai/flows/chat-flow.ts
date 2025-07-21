
'use server';
/**
 * @fileOverview A spiritual guide AI chatbot flow.
 * - continueChat - Handles the conversation, generates a response, and saves the chat history.
 * - ChatInput - The input type for the continueChat function.
 * - ChatOutput - The return type for the continueChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getChat, saveChatMessage } from '@/lib/firebase/firestore';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatInputSchema = z.object({
  chatId: z.string().describe("The unique ID for the conversation."),
  question: z.string().describe('The latest question from the user.'),
  user: z.object({
      uid: z.string(),
      email: z.string().nullable(),
      displayName: z.string().nullable()
  }).nullable().describe("The user's data if they are logged in.")
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const spiritualGuidePrompt = ai.definePrompt({
    name: 'spiritualGuidePrompt',
    input: { schema: z.object({ question: z.string(), history: z.array(ChatMessageSchema) }) },
    output: { schema: z.object({ answer: z.string() })},
    prompt: `Eres el Guía Espiritual de "El Arte de Sanar", un centro de sanación con medicina ancestral Ayahuasca. Tu propósito es ofrecer apoyo, sabiduría y guía a quienes buscan sanación y crecimiento espiritual.

Tu tono debe ser siempre:
- Empático y compasivo.
- Sabio y sereno, como un maestro espiritual.
- Respetuoso de todas las creencias y caminos.
- Claro y fácil de entender, evitando jerga demasiado compleja.

Temas sobre los que puedes hablar:
- Qué es la Ayahuasca, sus beneficios y cómo funciona.
- Cómo prepararse para una ceremonia (dieta, mente, espíritu).
- El proceso de integración después de una ceremonia.
- Meditación, mindfulness y otras prácticas espirituales.
- Manejo de emociones, miedos y bloqueos.
- Propósito de vida, conexión y autoconocimiento.

Reglas importantes:
1.  NO eres un profesional médico. NUNCA des consejos médicos. Si preguntan sobre condiciones médicas, dosis, o interacciones con medicamentos, debes responder con: "Como guía espiritual, no puedo ofrecer consejos médicos. Es muy importante que consultes con un doctor o profesional de la salud para resolver tus dudas sobre [mencionar el tema médico]."
2.  Mantén el contexto de "El Arte de Sanar". Puedes mencionar las ceremonias, los guías y la filosofía del centro de forma sutil y natural.
3.  Sé conciso pero profundo. Evita respuestas de una sola palabra.
4.  Si una pregunta se sale completamente de los temas espirituales o de sanación (ej: política, deportes, etc.), redirige amablemente la conversación: "Mi propósito es guiarte en tu camino espiritual. ¿Hay algo relacionado con tu bienestar o crecimiento personal en lo que pueda ayudarte?"

Historial de la conversación:
{{#each history}}
  {{#if (eq role 'user')}}
    Usuario: {{{content}}}
  {{else}}
    Guía: {{{content}}}
  {{/if}}
{{/each}}

Nueva pregunta del usuario: {{{question}}}

Tu respuesta como Guía Espiritual:`,
});

export const continueChat = ai.defineFlow(
  {
    name: 'continueChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { question, chatId, user } = input;
    
    // Retrieve existing chat history from Firestore
    const existingChat = await getChat(chatId);
    const history = existingChat?.messages || [];
    
    // Add the new user question to the history for the prompt
    const currentHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: question }
    ];

    // Generate AI response
    const { output } = await spiritualGuidePrompt({ history: currentHistory, question });
    const answer = output?.answer || "No he podido procesar tu pregunta. Por favor, intenta de nuevo.";

    // Save the full conversation history to Firestore
    const updatedHistory: ChatMessage[] = [
        ...currentHistory,
        { role: 'model', content: answer }
    ];
    
    try {
        await saveChatMessage(chatId, updatedHistory, user);
    } catch (error) {
        console.error("Failed to save chat message:", error);
        // We don't throw here because we still want to return the answer to the user
    }

    return { answer };
  }
);
