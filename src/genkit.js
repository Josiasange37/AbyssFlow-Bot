
require('dotenv').config();

const { gemini20Flash, googleAI } = require('@genkit-ai/googleai');
const { genkit } = require('genkit');

// Map GEMINI_API_KEY to GOOGLE_GENAI_API_KEY if not set
if (!process.env.GOOGLE_GENAI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENAI_API_KEY = process.env.GEMINI_API_KEY;
}

// Configure a Genkit instance with Gemini 2.0 Flash
const ai = genkit({
    plugins: [googleAI()],
    model: gemini20Flash, // Latest Gemini model available in Genkit
});

// Define a simple hello flow
const helloFlow = ai.defineFlow('helloFlow', async (name) => {
    const { text } = await ai.generate(`Hello Gemini, my name is ${name}`);
    console.log(text);
    return text;
});

// Export for use in other modules
module.exports = { ai, helloFlow };

// Test run if executed directly
if (require.main === module) {
    console.log('🚀 Running Genkit Hello Flow test...');
    console.log('📍 API key configured:', process.env.GOOGLE_GENAI_API_KEY ? '✅' : '❌');

    helloFlow('Josias')
        .then((result) => console.log('✅ Test completed! Response:', result))
        .catch((err) => console.error('❌ Error:', err.message));
}
