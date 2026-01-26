const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
  name: 'imagine',
  aliases: ['art', 'gen', 'draw'],
  description: 'Generate an AI image from a prompt',
  async execute({ chatId, args, bot, message }) {
    try {
      const prompt = args.join(' ');
      if (!prompt) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nSpécifiez une description pour la génération d'image : \`${bot.config?.prefix || '*'}imagine [description]\`.` }, { quoted: message });
      }

      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Génération Visuelle*\nTraitement de la requête graphique en cours...` }, { quoted: message });

      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
      });
      const buffer = Buffer.from(response.data);

      await bot.sendMessage(chatId, {
        image: buffer,
        caption: `* \`${bot.botName || 'Diane'}\` *\n\n*Rendu Graphique*\nRequête : \`${prompt}\`\nMoteur : \`Flux v4.0\``
      }, { quoted: message });

    } catch (error) {
      log.error('Imagine command failed:', error.message);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nLe moteur de rendu est actuellement indisponible.` }, { quoted: message });
    }
  }
};
