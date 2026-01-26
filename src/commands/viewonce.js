module.exports = {
  name: 'viewonce',
  aliases: ['revealvo', 'antiviewonce'],
  description: 'Reveal a view-once message',
  async execute({ sock, chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nRépondez à un message à vue unique.` });
      }

      let viewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension
        || quoted.ephemeralMessage?.message?.viewOnceMessage
        || quoted.ephemeralMessage?.message?.viewOnceMessageV2;

      if (!viewOnce) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nContenu non volatile détecté.` });
      }

      const content = viewOnce.message;
      const mediaType = content.imageMessage ? 'image' : content.videoMessage ? 'video' : content.audioMessage ? 'audio' : null;

      if (!mediaType) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nFormat binaire non identifié.` });
      }

      const sender = message.message.extendedTextMessage.contextInfo.participant || '';
      const caption = `* \`${bot.botName || 'Diane'}\` *\n\n*Révélation de Données*\nOrigine : @${sender.split('@')[0]}\nNature : \`${mediaType.toUpperCase()}\``;

      let msgContent = {};
      if (mediaType === 'image') msgContent = { image: content.imageMessage.url ? { url: content.imageMessage.url } : content.imageMessage, caption };
      else if (mediaType === 'video') msgContent = { video: content.videoMessage.url ? { url: content.videoMessage.url } : content.videoMessage, caption };
      else if (mediaType === 'audio') msgContent = { audio: content.audioMessage.url ? { url: content.audioMessage.url } : content.audioMessage, mimetype: content.audioMessage.mimetype, ptt: content.audioMessage.ptt };

      msgContent.mentions = [sender];

      await bot.sendMessage(chatId, msgContent, { quoted: message });

    } catch (error) {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nLe contenu s'est désintégré avant interception.` });
    }
  }
};
