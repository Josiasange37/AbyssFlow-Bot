/**
 * GenkitBrain.js
 * Advanced Genkit implementation for AbyssFlow-Bot
 * Powered by Gemini 2.0 Flash
 */
require('dotenv').config();

const { gemini20Flash, googleAI } = require('@genkit-ai/googleai');
const { genkit, z } = require('genkit');

// Map GEMINI_API_KEY to GOOGLE_GENAI_API_KEY if not set
if (!process.env.GOOGLE_GENAI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENAI_API_KEY = process.env.GEMINI_API_KEY;
}

// Configure Genkit with Google AI
const ai = genkit({
    plugins: [googleAI()],
    model: gemini20Flash,
});

// Assistant System Prompt
const SYSTEM_PROMPT = `Vous êtes un assistant WhatsApp utile, concis et honnête.

RÈGLES :
- Répondez en fonction du contexte (français ou autre langue selon l'utilisateur).
- Soyez concis et direct. Pas de blabla inutile.
- Ne prétendez jamais être humain. Soyez transparent sur le fait que vous êtes une IA.
- Poli et professionnel avec tout le monde.`;

// Define the main chat flow
const chatFlow = ai.defineFlow(
    {
        name: 'chatFlow',
        inputSchema: z.string(),
        outputSchema: z.string(),
    },
    async (input) => {
        // Generate response using Gemini 2.0 Flash with system prompt history
        const { text } = await ai.generate({
            prompt: input,
            history: [
                { role: 'system', content: [{ text: SYSTEM_PROMPT }] }
            ]
        });
        return text;
    }
);

// Export for external use
module.exports = { ai, chatFlow };
