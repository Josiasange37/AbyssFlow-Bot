const { OpenAI } = require('openai');
const { log } = require('../../../utils/logger');
const { CONFIG } = require('../../../config');

class OpenRouterProvider {
    static init() {
        this.keys = CONFIG.openRouterKeys;
        this.currentKeyIndex = 0;

        if (!this.keys || this.keys.length === 0) {
            log.warn('⚠️ No OpenRouter API Keys found.');
            return false;
        }

        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: this.keys[0],
            defaultHeaders: {
                "HTTP-Referer": "https://abyssflow.bot",
                "X-Title": "Diane Assistant",
            }
        });

        log.info(`🚀 OpenRouter Provider Initialized (${this.keys.length} keys available)`);
        return true;
    }

    static rotateKey() {
        if (this.keys.length <= 1) return;
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        this.client.apiKey = this.keys[this.currentKeyIndex];
        log.info(`🔄 Rotated to OpenRouter Key #${this.currentKeyIndex + 1}`);
    }

    static async process(text, history = [], systemPrompt = null) {
        if (!this.client) return null;

        try {
            const messages = [
                { role: "system", content: systemPrompt || "You are Diane, a helpful assistant." },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.text
                })),
                { role: "user", content: text }
            ];

            const completion = await this.client.chat.completions.create({
                model: "google/gemini-2.0-flash-exp:free", // Using free/cheap high-quality model
                messages: messages,
                max_tokens: 500,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || null;

        } catch (error) {
            log.error(`OpenRouter Error: ${error.message}`);
            // Check for quota/auth errors to rotate key
            if (error.status === 401 || error.status === 429) {
                this.rotateKey();
            }
            throw error;
        }
    }
}

module.exports = OpenRouterProvider;
