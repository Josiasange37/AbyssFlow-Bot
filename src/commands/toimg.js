module.exports = {
  name: 'toimg',
  aliases: ['toimage', 'topng'],
  description: 'Convert sticker to image',
  async execute({ sock, chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const stickerMessage = quoted?.stickerMessage;

      if (!stickerMessage) {
        return await bot.sendSafeMessage(chatId, `faut répondre à un sticker avec la commande .`);
      }

      await bot.sendMessage(chatId, { text: `⏳ Conversion en cours...` }, { quoted: message });

      const buffer = await bot.downloadMedia(stickerMessage, 'sticker');

      await bot.sendMessage(chatId, {
        image: buffer,
        caption: `Tiens ! ✨`
      }, { quoted: message });

    } catch (error) {
      await bot.sendSafeMessage(chatId, `j'ai pas réussi à convertir :/`);
    }
  }
};
