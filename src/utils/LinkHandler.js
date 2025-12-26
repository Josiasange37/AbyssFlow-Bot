const ogs = require('open-graph-scraper');
const axios = require('axios');
const { log } = require('./logger');

class LinkHandler {
    constructor() {
        this.videoDomains = [
            'youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com',
            'fb.watch', 'facebook.com', 'twitter.com', 'x.com',
            'pinteres.it', 'pinterest.com', 'threads.net', 'capcut.com'
        ];
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

            // Array of reliable download APIs as fallbacks
            const apis = [
                `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(url)}`,
                `https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(url)}`, // Specialized TikTok
                `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`,
                `https://api.agatz.xyz/api/youtube?url=${encodeURIComponent(url)}`
            ];

            let downloadUrl = null;
            let success = false;

            for (const apiUrl of apis) {
                try {
                    const response = await axios.get(apiUrl, { timeout: 15000 });
                    const res = response.data;

                    // Handle different API response structures
                    downloadUrl = res.result?.url || res.result?.video || res.data?.url || res.url;

                    if (downloadUrl) {
                        success = true;
                        break;
                    }
                } catch (e) {
                    continue; // try next API
                }
            }

            if (success && downloadUrl) {
                await bot.sendMessage(chatId, {
                    video: { url: downloadUrl },
                    caption: `✅ C'est prêt bg ! Flow Psycho Bo 🤙⚡\n🔗 ${url}`
                }, { quoted: message });
                return true;
            } else {
                throw new Error('All APIs failed');
            }
        } catch (error) {
            log.error(`Video download failed for ${url}: ${error.message}`);
            await bot.sendMessage(chatId, { text: "Désolé bg, j'arrive pas à graille cette vidéo pour le moment. 💀\n\n_Le serveur de téléchargement est peut-être saturé, réessaie plus tard !_ " }, { quoted: message });
        }
        return false;
    }
}

module.exports = new LinkHandler();
