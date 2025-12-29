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

        let messages = [
            { role: 'system', content: systemPrompt || "You are a helpful assistant." },
            ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text || msg.message || ""
            }))
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
                    { type: "image_url", image_url: dataUrl } // Use image_url (standard)
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
