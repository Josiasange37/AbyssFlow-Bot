const LinkHandler = require('../utils/LinkHandler');

module.exports = {
  name: 'download',
  aliases: ['dl', 'play', 'video', 'music'],
  description: 'Download media from links (TikTok, YouTube, IG, etc.)',
  async execute({ chatId, args, bot, message }) {
    const url = args[0];
    if (!url) {
      return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide au Téléchargement*\nVeuillez fournir une URL de source valide.` }, { quoted: message });
    }

    const handled = await LinkHandler.handle(bot, chatId, url, message);
    if (!handled) {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Échec du Transfert*\nLe protocole de téléchargement n'a pas pu traiter cette source.` }, { quoted: message });
    }
  }
};
