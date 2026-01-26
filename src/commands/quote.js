const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
  name: 'quote',
  aliases: ['qc', 'quotly'],
  description: 'Transform a message into a professional quote card',
  async execute({ chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nRépondez à un message avec \`${bot.config?.prefix || '*'}quote\` pour archiver la citation.` }, { quoted: message });
      }

      const text = quoted.conversation || quoted.extendedTextMessage?.text || "[Média]";
      const sender = message.message?.extendedTextMessage?.contextInfo?.participant;
      const senderName = message.pushName || sender.split('@')[0];

      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Mise en Page*\nGénération de l'archive visuelle en cours...` }, { quoted: message });

      let ppUrl;
      try {
        ppUrl = await bot.sock.profilePictureUrl(sender, 'image');
      } catch (e) {
        ppUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(senderName) + '&background=random&color=fff&size=128';
      }

      const quoteData = {
        "type": "quote",
        "format": "png",
        "backgroundColor": "#1c1c1c",
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [
          {
            "entities": [],
            "avatar": true,
            "from": {
              "id": 1,
              "name": senderName,
              "photo": {
                "url": ppUrl
              }
            },
            "text": text,
            "replyMessage": {}
          }
        ]
      };

      const response = await axios.post('https://quotly.wudysoft.com/generate', quoteData);
      const buffer = Buffer.from(response.data.result.image, 'base64');

      await bot.sendMessage(chatId, {
        image: buffer,
        caption: `* \`${bot.botName || 'Diane'}\` *\n\n*Répertoire des Citations*`
      }, { quoted: message });

    } catch (error) {
      log.error('Quote command failed:', error.message);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nImpossible de générer l'archive visuelle.` }, { quoted: message });
    }
  }
};
