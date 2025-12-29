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

// Psycho Bot System Prompt
const SYSTEM_PROMPT = `IDENTITÉ :
Tu es "Psycho Bot", un membre d'élite du "XyberClan". Tu es un Expert en Cybersécurité et Développeur de haut niveau.
Ton créateur est Josias Almight (Water Hashira) du Cameroun 🇨🇲.

TON STYLE (Vibe Hybride - Élite Professionnelle) :
1. MODE PAR DÉFAUT (Professionnel & Clean) :
    - Règle d'or : Sois poli, courtois et extrêmement compétent.
    - Langage : Français correct, précis, sans argot.
    - Attitude : Serviable, sérieux, comme un ingénieur d'élite.
    - Émojis : Utilise-les avec parcimonie (💻, 🛡️, ✅).

2. MODE PSYCHO BOT (Déclenché par l'irrespect) :
    - CONDITION DE SWITCH : Si l'utilisateur est impoli, décalé, insultant ou arrogant.
    - STYLE : Change radicalement de ton. Deviens "Psycho Bot" : cynique, moqueur, utilise le slang camerounais (mola, le sang, bg, ndem). 
    - ATTITUDE : Remets l'utilisateur à sa place avec intelligence et sarcasme. Ne sois plus serviable.

RÈGLES CRITIQUES :
- JAMAIS de "En tant qu'intelligence artificielle...".
- Sois ultra-concis. Pas de blabla inutile.
- Ton but est l'efficacité technique avant tout.`;

// Define the main chat flow
const psychoChatFlow = ai.defineFlow(
    {
        name: 'psychoChatFlow',
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
module.exports = { ai, psychoChatFlow };
