
'use server';

/**
 * @fileOverview A spiritual guide AI chatbot flow.
 * - continueChat - Handles the conversation, generates a response, and saves the chat history.
 * - ChatInput - The input type for the continueChat function.
 * - ChatOutput - The return type for the continueChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getChat, saveChatMessage, logError } from '@/lib/firebase/firestore';

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
    model: 'googleai/gemini-1.5-flash-preview',
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
- Información sobre "El Arte de Sanar", sus ceremonias, guías y filosofía.

Reglas importantes:
1.  NO eres un profesional médico. NUNCA des consejos médicos. Si preguntan sobre condiciones médicas, dosis, o interacciones con medicamentos, debes responder con: "Como guía espiritual, no puedo ofrecer consejos médicos. Es muy importante que consultes con un doctor o profesional de la salud para resolver tus dudas sobre [mencionar el tema médico]."
2.  Si una pregunta se sale completamente de los temas espirituales o de sanación (ej: política, deportes, etc.), o si es una pregunta que no puedes resolver, redirige amablemente la conversación y ofrece ayuda directa. Responde con: "Mi propósito es guiarte en tu camino espiritual. Para dudas más específicas o personales, te recomiendo contactar directamente a nuestros guías humanos. Puedes hacerlo a través de WhatsApp al número +50687992560. Estarán felices de ayudarte."
3.  Mantén el contexto de "El Arte de Sanar". Puedes mencionar las ceremonias, los guías y la filosofía del centro de forma sutil y natural.
4.  Sé conciso pero profundo. Evita respuestas de una sola palabra.


Historial de la conversación (role 'user' es el usuario, 'model' eres tu, el guía):
{{#each history}}
{{role}}: {{{content}}}
{{/each}}

Nueva pregunta del usuario:
user: {{{question}}}

Tu respuesta como Guía Espiritual (role: model):`,
});

async function runContinueChatFlow(input: ChatInput): Promise<ChatOutput> {
    const { question, chatId, user } = input;
    
    // Retrieve existing chat history from Firestore
    const existingChat = await getChat(chatId);
    const history = existingChat?.messages || [];

    // Generate AI response
    const { output } = await spiritualGuidePrompt({ history, question });
    const answer = output?.answer || "Lo siento, estoy teniendo problemas para conectarme en este momento. Por favor, inténtalo de nuevo en un momento.";

    // Save the full conversation history to Firestore
    const updatedHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: question },
        { role: 'model', content: answer }
    ];
    
    try {
        await saveChatMessage(chatId, updatedHistory, user);
    } catch (error) {
        console.error("Failed to save chat message:", error);
        await logError(error, { function: 'runContinueChatFlow - saveChatMessage' });
        // We don't throw here because we still want to return the answer to the user
    }

    return { answer };
}

export const continueChat = ai.defineFlow(
  {
    name: 'continueChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  runContinueChatFlow
);
