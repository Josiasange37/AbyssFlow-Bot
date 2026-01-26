module.exports = {
  name: 'toimg',
  aliases: ['toimage', 'topng'],
  description: 'Convert sticker to image',
  async execute({ sock, chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const stickerMessage = quoted?.stickerMessage;

      if (!stickerMessage) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez répondre à un sticker avec cette commande.` });
      }

      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Traitement de Média*\nExtraction de la couche graphique en cours...` }, { quoted: message });

      const buffer = await bot.downloadMedia(stickerMessage, 'sticker');

      await bot.sendMessage(chatId, {
        image: buffer,
        caption: `* \`${bot.botName || 'Diane'}\` *\n\n*Rendu PNG Terminé*`
      }, { quoted: message });

    } catch (error) {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de la conversion graphique.` });
    }
  }
};
