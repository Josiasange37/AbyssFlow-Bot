const { log } = require('../utils/logger');
const sharp = require('sharp');

module.exports = {
  name: 'quote',
  aliases: ['qc', 'quotly'],
  description: 'Transform a message into a beautiful quote card',
  async execute({ chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return await bot.sendMessage(chatId, { text: "Faut répondre à un message avec la commande pour le quote ! ✍️" }, { quoted: message });
      }

      const text = quoted.conversation || quoted.extendedTextMessage?.text || "[Média]";
      const sender = message.message?.extendedTextMessage?.contextInfo?.participant;
      const senderName = message.pushName || sender.split('@')[0];

      await bot.sendMessage(chatId, { text: "⏳ Je prépare ton chef-d'œuvre... 🎨" }, { quoted: message });

      // Fetch profile pic
      let ppUrl;
      try {
        ppUrl = await bot.sock.profilePictureUrl(sender, 'image');
      } catch (e) {
        ppUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(senderName) + '&background=random&color=fff&size=128';
      }

      // For simplicity and speed in this environment, we'll use a public Quoter API 
      // if possible, otherwise we fallback to a styled text message or SVG generation.
      // Using a well-known public API for this (Quotly style)
      const axios = require('axios');
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
        caption: `Flow Psycho Quote 🤙✨`
      }, { quoted: message });

    } catch (error) {
      log.error('Quote command failed:', error.message);
      await bot.sendMessage(chatId, { text: "Impossible de générer le quote... 🛠️" }, { quoted: message });
    }
  }
};
