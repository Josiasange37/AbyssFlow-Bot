const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
    name: 'wiki',
    category: 'info',
    description: 'Cherche un truc sur Wikipedia.',
    execute: async ({ sock, chatId, message, args }) => {
        const query = args.join(' ');
        if (!query) return await bot.sendMessage(chatId, { text: "Dis-moi ce que tu cherches mola ! 🧐" }, { quoted: message });

        try {
            const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const response = await axios.get(url);

            if (response.data.type === 'standard') {
                const text = `📖 *WIKIPEDIA : ${response.data.title}* \n\n${response.data.extract}\n\n🔗 _En savoir plus : ${response.data.content_urls.desktop.page}_`;
                await bot.sendMessage(chatId, { text }, { quoted: message });
            } else {
                await bot.sendMessage(chatId, { text: "J'ai rien trouvé sur Wikipedia pour ça. T'es sûr que ça existe ? 🤨" }, { quoted: message });
            }
        } catch (error) {
            log.error('Wiki Error:', error.message);
            await bot.sendMessage(chatId, { text: "Petit bug technique en cherchant sur Wiki. On reessaie plus tard ! 🛠️" }, { quoted: message });
        }
    }
};
