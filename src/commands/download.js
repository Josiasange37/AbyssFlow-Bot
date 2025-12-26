const LinkHandler = require('../utils/LinkHandler');

module.exports = {
    name: 'download',
    aliases: ['dl', 'play', 'video', 'music'],
    description: 'Download media from links (TikTok, YouTube, IG, etc.)',
    async execute({ chatId, args, bot, message }) {
        const url = args[0];
        if (!url) {
            return await bot.sendMessage(chatId, { text: "❌ Tu n'as pas mis de lien, chef ! Utilisation: *.dl [lien]*" }, { quoted: message });
        }

        const handled = await LinkHandler.handle(bot, chatId, url, message);
        if (!handled) {
            await bot.sendMessage(chatId, { text: "💀 Désolé bg, j'ai pas pu gérer ce lien. Vérifie qu'il est correct !" }, { quoted: message });
        }
    }
};
