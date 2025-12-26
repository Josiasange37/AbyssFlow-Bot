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
                { url: `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(url)}`, type: 'general' },
                { url: `https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' },
                { url: `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' },
                { url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`, type: 'instagram' },
                { url: `https://api.botcahx.eu.org/api/dowloader/tiktok?url=${encodeURIComponent(url)}&apikey=PsychoBot`, type: 'tiktok' },
                { url: `https://api.botcahx.eu.org/api/dowloader/instagram?url=${encodeURIComponent(url)}&apikey=PsychoBot`, type: 'instagram' },
                { url: `https://bk9.site/download/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' }
            ];

            let downloadUrl = null;
            let success = false;

            for (const api of apis) {
                // Filter APIs based on URL if possible to save time
                if (api.type !== 'general' && !url.includes(api.type)) continue;

                try {
                    const response = await axios.get(api.url, { timeout: 10000 });
                    const res = response.data;

                    // Support multiple response formats (vreden, agatz, botcahx, etc.)
                    downloadUrl = res.result?.url || res.result?.video || res.data?.url || res.data?.video || res.url ||
                        (res.result?.data?.find(d => d.type === 'video') || res.result?.data?.[0])?.url;

                    if (downloadUrl && typeof downloadUrl === 'string' && downloadUrl.startsWith('http')) {
                        success = true;
                        log.info(`✅ Video found via ${api.type} API: ${api.url.split('?')[0]}`);
                        break;
                    }
                } catch (e) {
                    log.debug(`Downloader API failed: ${api.url.split('?')[0]} - ${e.message}`);
                    continue;
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
