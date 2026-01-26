const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
  name: 'wiki',
  category: 'info',
  description: 'Cherche un truc sur Wikipedia.',
  execute: async ({ chatId, message, args, bot }) => {
    const query = args.join(' ');
    if (!query) return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nSpécifiez le sujet de recherche encyclopédique.` }, { quoted: message });

    try {
      const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await axios.get(url);

      if (response.data.type === 'standard') {
        const text = [
          `* \`${bot.botName || 'Diane'}\` *`,
          ``,
          `*EXTRACTION ENCYCLOPÉDIQUE : ${response.data.title.toUpperCase()}*`,
          ``,
          response.data.extract,
          ``,
          `Référence complète : ${response.data.content_urls.desktop.page}`
        ].join('\n');
        await bot.sendMessage(chatId, { text }, { quoted: message });
      } else {
        await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Alerte*\nAucune occurrence trouvée dans les registres Wikipedia.` }, { quoted: message });
      }
    } catch (error) {
      log.error('Wiki Error:', error.message);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de la connexion aux serveurs de connaissances.` }, { quoted: message });
    }
  }
};
