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
      // Use explicit image endpoint for better API behavior
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

      // Download buffer to ensure delivery (fixes "video error" or broken thumbnail)
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      await bot.sendMessage(chatId, {
        image: buffer,
        caption: `🎨 *Art by Psycho Bo* 🤙✨\n\n📝 *Prompt:* ${prompt}\n🚀 *Model:* Flux (Xyber-Elite)`
      }, { quoted: message });

    } catch (error) {
      log.error('Imagine command failed:', error.message);
      await bot.sendMessage(chatId, { text: "Mon pinceau est cassé là... 🛠️ Réessaie plus tard !" }, { quoted: message });
    }
  }
};
