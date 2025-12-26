const axios = require('axios');
const { log } = require('../utils/logger');
const { CONFIG } = require('../config');

module.exports = {
    name: 'google',
    aliases: ['g', 'search'],
    category: 'info',
    description: 'Cherche un truc sur Google.',
    execute: async ({ sock, chatId, message, args }) => {
        const query = args.join(' ');
        if (!query) return await sock.sendMessage(chatId, { text: "Dis-moi ce que tu cherches bg ! 🧐" }, { quoted: message });

        try {
            await sock.sendMessage(chatId, { text: "Attends mola, je fouille le web... 🔍🕸️" }, { quoted: message });

            // Use SerpApi if key is available, else fallback to a public search or informative message
            if (CONFIG.searchApiKey) {
                const response = await axios.get('https://serpapi.com/search', {
                    params: {
                        q: query,
                        api_key: CONFIG.searchApiKey,
                        engine: 'google',
                        hl: 'fr'
                    }
                });

                const results = response.data.organic_results;
                if (results && results.length > 0) {
                    let text = `🔍 *RÉSULTATS GOOGLE POUR : ${query.toUpperCase()}* \n\n`;
                    results.slice(0, 3).forEach((res, i) => {
                        text += `${i + 1}. *${res.title}*\n${res.snippet}\n🔗 _${res.link}_\n\n`;
                    });
                    return await sock.sendMessage(chatId, { text }, { quoted: message });
                }
            }

            // Fallback if no key or no results
            await sock.sendMessage(chatId, { text: "J'ai rien trouvé de probant mola. T'as pas une question plus facile ? 🤨" }, { quoted: message });

        } catch (error) {
            log.error('Google Search Error:', error.message);
            await sock.sendMessage(chatId, { text: "Le web est trop sombre aujourd'hui, j'arrive pas à chercher. 💀" }, { quoted: message });
        }
    }
};
