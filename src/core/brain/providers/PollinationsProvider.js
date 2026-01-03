const { log } = require('../../../utils/logger');
const axios = require('axios');

class PollinationsProvider {
    constructor() {
        this.baseUrl = "https://image.pollinations.ai/prompt/";
    }

    /**
     * Generates an image URL using Pollinations.ai
     * @param {string} prompt - The image description
     * @param {object} options - Optional parameters (seed, width, height, model)
     * @returns {string|null} - The image URL or null if failed
     */
    async generateImage(prompt, options = {}) {
        if (!prompt) return null;

        try {
            const seed = options.seed || Math.floor(Math.random() * 1000000);
            const width = options.width || 1024;
            const height = options.height || 1024;
            const model = "flux"; // Defaulting to refined model if available, or just letting API decide

            // Construct URL: https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}&seed={seed}&nologo=true
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `${this.baseUrl}${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}`;

            // Verification Ping (Head request to ensure it works)
            try {
                await axios.head(imageUrl);
                log.info(`🎨 Pollinations generated image for: "${prompt}"`);
                return imageUrl;
            } catch (pingError) {
                // Even if HEAD fails, the URL might still work for the user, but log it.
                log.warn(`Pollinations ping failed, but returning URL anyway: ${pingError.message}`);
                return imageUrl;
            }
        } catch (error) {
            log.error('Pollinations generation failed:', error.message);
            return null;
        }
    }
}

module.exports = new PollinationsProvider();
