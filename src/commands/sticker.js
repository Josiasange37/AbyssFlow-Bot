module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  description: 'Convert image/video to sticker',
  async execute({ sock, chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || message.message;
      const mediaMessage = quoted?.imageMessage || quoted?.videoMessage;

      if (!mediaMessage) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez fournir une image ou une vidéo avec la commande.` }, { quoted: message });
      }

      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Traitement de Média*\nConversion en format sticker en cours...` }, { quoted: message });

      const type = quoted?.imageMessage ? 'image' : 'video';
      const buffer = await bot.downloadMedia(mediaMessage, type);

      await bot.sendMessage(chatId, {
        sticker: buffer
      }, { quoted: message });

    } catch (error) {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de la conversion binaire.` }, { quoted: message });
    }
  }
};
