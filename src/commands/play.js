const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
    name: 'play',
    aliases: ['song', 'musique', 'yt'],
    description: 'Search and download music from YouTube',
    async execute({ chatId, args, bot, message }) {
        try {
            const query = args.join(' ');
            if (!query) {
                return await bot.sendMessage(chatId, { text: "Dis-moi quel son tu veux mola ! 🎧🔥\n\nEx: *play Burna Boy City Boys" }, { quoted: message });
            }

            await bot.sendMessage(chatId, { text: `🔍 Recherche de "${query}" sur YouTube... ⏳` }, { quoted: message });

            // 1. Search and get download link
            // Using a reliable download API
            const searchUrl = `https://api.vreden.my.id/api/ytplay?query=${encodeURIComponent(query)}`;
            const response = await axios.get(searchUrl, { timeout: 20000 });
            const res = response.data;

            if (!res || !res.result) {
                throw new Error('API returned no result');
            }

            const result = res.result;
            const downloadUrl = result.download?.url || result.music;
            const title = result.title || "Musique";
            const thumbnail = result.thumbnail;

            if (!downloadUrl) {
                throw new Error('No download link found');
            }

            await bot.sendMessage(chatId, {
                image: { url: thumbnail },
                caption: `🎶 *En train de graille :* ${title}\n\n⏳ Je t'envoie l'audio mola, bouge pas ! 🤙🔥`
            }, { quoted: message });

            // 2. Download and send as audio
            const audioResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 60000 });
            const buffer = Buffer.from(audioResponse.data);

            await bot.sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false // Set to true if you want it as a voice note
            }, { quoted: message });

        } catch (error) {
            log.error('Play command failed:', error.message);
            await bot.sendMessage(chatId, { text: "Désolé bg, j'arrive pas à choper cette musique. Le serveur est peut-être saturé ! 💀" }, { quoted: message });
        }
    }
};
