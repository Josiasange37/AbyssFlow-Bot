const { Mistral } = require('@mistralai/mistralai');
const { log } = require('../../../utils/logger');
const { CONFIG } = require('../../../config');

class MistralProvider {
    constructor() {
        this.client = null;
    }

    init() {
        if (!CONFIG.keys.mistral) {
            log.warn('⚠️ No Mistral API Key found');
            return false;
        }
        try {
            this.client = new Mistral({ apiKey: CONFIG.keys.mistral });
            log.info('🌪️ Mistral (Large + Pixtral) Initialized');
            return true;
        } catch (error) {
            log.error('❌ Failed to init Mistral:', error);
            return false;
        }
    }

    async process(text, chatHistory = [], media = null, systemPrompt = "Act like Psycho Bot.") {
        if (!this.client) throw new Error('MISTRAL_NOT_INIT');

        let userContent = text;
        let modelToUse = 'mistral-large-latest';

        // Handle Image Input (Pixtral)
        if (media) {
            const base64Image = media.buffer.toString('base64');
            const dataUrl = `data:${media.mimetype};base64,${base64Image}`;
            userContent = [
                { type: "text", text: text || "Analyse cette image." },
                { type: "image_url", imageUrl: dataUrl }
            ];
            modelToUse = 'pixtral-12b-2409'; // Use Pixtral for images
            log.info('🖼️ Using Pixtral for image analysis');
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role,
                content: msg.message || msg.text // Handle varying property names in history
            })),
            { role: "user", content: userContent }
        ];

        try {
            // Use standard chat.complete (Tools removed for reliability)
            const response = await this.client.chat.complete({
                model: modelToUse,
                messages: messages,
                maxTokens: 1024
            });

            return response.choices[0].message.content;
        } catch (error) {
            log.error('Mistral process failed:', error.message);
            throw error;
        }
    }

    async generateImage(prompt) {
        if (!this.client) throw new Error('MISTRAL_NOT_READY');

        try {
            const response = await this.client.beta.conversations.start({
                inputs: [{ role: "user", content: `Generate an image: ${prompt}` }],
                model: 'mistral-large-latest',
                tools: [{ type: "image_generation" }],
                maxTokens: 256
            });

            // Extract image URL from response
            if (response.outputs) {
                for (const output of response.outputs) {
                    // Check direct image
                    if (output.type === 'image' && output.url) {
                        return `[IMAGE] ${output.url}`;
                    }
                    // Check nested in content
                    if (output.type === 'message.output' && Array.isArray(output.content)) {
                        for (const item of output.content) {
                            if (item.type === 'image' && item.url) return `[IMAGE] ${item.url}`;
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            log.error('Mistral image generation failed:', error.message);
            return null;
        }
    }
}

module.exports = new MistralProvider();
