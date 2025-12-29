module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  description: 'Convert image/video to sticker',
  async execute({ sock, chatId, message, bot, config }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || message.message;
      const mediaMessage = quoted?.imageMessage || quoted?.videoMessage;

      if (!mediaMessage) {
        return await bot.sendSafeMessage(chatId, `faut m'envoyer une image ou une vidéo (ou répondre à une) avec la commande ${config.prefix}sticker .`);
      }

      await bot.sendMessage(chatId, { text: `⏳ Je prépare ton sticker...` }, { quoted: message });

      const type = quoted?.imageMessage ? 'image' : 'video';
      const buffer = await bot.downloadMedia(mediaMessage, type);

      await bot.sendMessage(chatId, {
        sticker: buffer
      }, { quoted: message });

    } catch (error) {
      await bot.sendSafeMessage(chatId, `gros fail sur le sticker: ${error.message}`);
    }
  }
};
