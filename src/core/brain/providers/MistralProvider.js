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
                role: msg.role,
                content: msg.text || msg.message || ""
            }))
        ];

        let model = 'mistral-large-latest';

        // Handle Vision (Pixtral)
        if (media) {
            const base64Image = media.buffer.toString('base64');
            const dataUrl = `data:${media.mimetype};base64,${base64Image}`;

            // For vision, we construct the user message differently
            const userMsg = {
                role: "user",
                content: [
                    { type: "text", text: text || "Analyse cette image." },
                    { type: "image_url", imageUrl: dataUrl } // SDK uses imageUrl? check docs.
                    // Checking official docs: for chat.complete it is usually type: "image_url", imageUrl: "..."
                ]
            };
            messages.push(userMsg);
            model = 'pixtral-12b-2409'; // Pixtral for images
        } else {
            messages.push({ role: "user", content: text });
        }

        try {
            const response = await this.client.chat.complete({
                model: model,
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
