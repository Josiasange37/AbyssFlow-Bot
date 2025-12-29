const Groq = require('groq-sdk');
const { log } = require('../../../utils/logger');
const { CONFIG } = require('../../../config');

class GroqProvider {
    constructor() {
        this.client = null;
    }

    init() {
        if (!CONFIG.groqApiKey) {
            log.warn('⚠️ No Groq API Key found');
            return false;
        }
        try {
            this.client = new Groq({ apiKey: CONFIG.groqApiKey });
            log.info('🚀 Groq (Llama 3.3) Initialized');
            return true;
        } catch (error) {
            log.error('❌ Failed to init Groq:', error);
            return false;
        }
    }

    async process(text, chatHistory, systemPrompt) {
        if (!this.client) throw new Error('GROQ_NOT_READY');

        // Ensure system prompt has content
        const sysPrompt = systemPrompt || "You are a helpful assistant.";

        const messages = [
            { role: "system", content: sysPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text || ""
            })),
            { role: "user", content: text }
        ];

        try {
            const completion = await this.client.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                max_tokens: 512,
                temperature: 0.8
            });

            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            log.error('Groq process failed:', error);
            throw error;
        }
    }
}

module.exports = new GroqProvider();
