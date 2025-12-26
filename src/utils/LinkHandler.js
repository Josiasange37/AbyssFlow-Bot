const ogs = require('open-graph-scraper');
const axios = require('axios');
const { log } = require('./logger');

class LinkHandler {
    constructor() {
        this.videoDomains = ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'fb.watch', 'facebook.com'];
    }

    async handle(bot, chatId, text, message) {
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        if (!urlMatch) return false;

        const url = urlMatch[0];
        const isVideo = this.videoDomains.some(domain => url.includes(domain));

        if (isVideo) {
            return await this.handleVideo(bot, chatId, url, message);
        } else {
            return await this.handleWebsite(bot, chatId, url, message);
        }
    }

    async handleWebsite(bot, chatId, url, message) {
        try {
            const options = { url };
            const { result } = await ogs(options);

            if (result.success && result.ogTitle) {
                let banner = `📰 *${result.ogTitle}*\n\n`;
                if (result.ogDescription) banner += `${result.ogDescription}\n\n`;
                banner += `🔗 _${url}_`;

                const msgConfig = { text: banner };
                if (result.ogImage && result.ogImage[0] && result.ogImage[0].url) {
                    msgConfig.image = { url: result.ogImage[0].url };
                    msgConfig.caption = banner;
                    delete msgConfig.text;
                }

                await bot.sendMessage(chatId, msgConfig, { quoted: message });
                return true;
            }
        } catch (error) {
            log.debug(`Link preview failed for ${url}: ${error.message}`);
        }
        return false;
    }

    async handleVideo(bot, chatId, url, message) {
        try {
            await bot.sendMessage(chatId, { text: "🎬 Vidéo détectée ! Je prépare le téléchargement mola... ⏳" }, { quoted: message });

            // Using a free public API for downloads to avoid heavy local processing
            // Note: This is a placeholder for a robust downloader. 
            // Real-world robust downloading often requires dedicated workers.
            const response = await axios.get(`https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(url)}`);

            if (response.data.status && response.data.result && response.data.result.url) {
                await bot.sendMessage(chatId, {
                    video: { url: response.data.result.url },
                    caption: `✅ Vidéo téléchargée propre !\n🔗 ${url}`
                }, { quoted: message });
                return true;
            }
        } catch (error) {
            log.error(`Video download failed for ${url}: ${error.message}`);
            await bot.sendMessage(chatId, { text: "Désolé bg, j'arrive pas à graille cette vidéo pour le moment. 💀" }, { quoted: message });
        }
        return false;
    }
}

module.exports = new LinkHandler();
