const { Mistral } = require('@mistralai/mistralai');
const { log } = require('../../../utils/logger');
const { CONFIG } = require('../../../config');

class MistralProvider {
    constructor() {
        this.client = null;
    }

    init() {
        if (!CONFIG.mistralApiKey) {
            log.warn('⚠️ No Mistral API Key found');
            return false;
        }
        try {
            this.client = new Mistral({ apiKey: CONFIG.mistralApiKey });
            log.info('🌪️ Mistral Initialized');
            return true;
        } catch (error) {
            log.error('❌ Failed to init Mistral:', error);
            return false;
        }
    }

    /**
     * Process with Mistral (Supports Vision and Tools)
     */
    async process(text, chatHistory = [], media = null, systemPrompt) {
        if (!this.client) throw new Error('MISTRAL_NOT_READY');

        // Sanitize History: Mistral enforces User/Assistant alternation
        let sanitizedHistory = [];
        if (chatHistory.length > 0) {
            let lastRole = 'system';
            for (const msg of chatHistory) {
                const currentRole = msg.role === 'user' ? 'user' : 'assistant';
                // Skip invalid/empty content
                if (!msg.text && !msg.message) continue;

                if (currentRole === lastRole && currentRole === 'user') {
                    // Merge consecutive user messages
                    sanitizedHistory[sanitizedHistory.length - 1].content += `\n\n${msg.text || msg.message}`;
                } else if (currentRole === lastRole && currentRole === 'assistant') {
                    // Skip consecutive assistant messages (or merge)
                    continue;
                } else {
                    sanitizedHistory.push({
                        role: currentRole,
                        content: msg.text || msg.message || "."
                    });
                    lastRole = currentRole;
                }
            }
        }

        let messages = [
            { role: 'system', content: systemPrompt || "You are a helpful assistant." },
            ...sanitizedHistory
        ];

        let modelName = 'mistral-large-latest';

        // Handle Vision (Pixtral)
        if (media) {
            const base64Image = media.buffer.toString('base64');
            const dataUrl = `data:${media.mimetype};base64,${base64Image}`;

            const userMsg = {
                role: "user",
                content: [
                    { type: "text", text: text || "Analyse cette image." },
                    { type: "image_url", imageUrl: dataUrl } // SDK expects imageUrl
                ]
            };
            messages.push(userMsg);
            modelName = 'pixtral-12b-2409';
        } else {
            messages.push({ role: "user", content: text });
        }

        try {
            const response = await this.client.chat.complete({
                model: modelName,
                messages: messages,
                maxTokens: 1024
            });

            return response.choices[0].message.content;
        } catch (error) {
            log.error('Mistral process failed:', error);
            throw error;
        }
    }

    async generateImage(prompt) {
        if (!this.client) return null;
        try {
            // Using tools for image gen? Or separate endpoint?
            // Mistral SDK doesn't have explicit image gen endpoint yet in typed client usually,
            // but we can try tool calling or simple prompting.
            // For now return null or implement if API supports it.
            return null;
        } catch (e) { return null; }
    }
}

module.exports = new MistralProvider();
