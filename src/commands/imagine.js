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
        return await bot.sendMessage(chatId, { text: "Dis-moi ce que tu veux que j'imagine ! 🎨\n\nEx: *imagine un paysage futuriste au Cameroun" }, { quoted: message });
      }

      await bot.sendMessage(chatId, { text: "⏳ Je connecte mes neurones artistiques... 🎨✨" }, { quoted: message });

      // Using Pollinations AI - very reliable and no key needed for simple usage
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux`;

      await bot.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: `🎨 *Art by Psycho Bo* 🤙✨\n\n📝 *Prompt:* ${prompt}\n🚀 *Model:* Flux (Xyber-Elite)`
      }, { quoted: message });

    } catch (error) {
      log.error('Imagine command failed:', error.message);
      await bot.sendMessage(chatId, { text: "Mon pinceau est cassé là... 🛠️ Réessaie plus tard !" }, { quoted: message });
    }
  }
};
