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

            // Brute Force API list - including specialized scrapers
            const apis = [
                { url: `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(url)}`, type: 'general' },
                { url: `https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' },
                { url: `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' },
                { url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`, type: 'instagram' },
                { url: `https://api.agatz.xyz/api/youtube?url=${encodeURIComponent(url)}`, type: 'youtube' },
                { url: `https://api.botcahx.eu.org/api/dowloader/tiktok?url=${encodeURIComponent(url)}&apikey=PsychoBot`, type: 'tiktok' },
                { url: `https://api.botcahx.eu.org/api/dowloader/instadl?url=${encodeURIComponent(url)}&apikey=PsychoBot`, type: 'instagram' },
                { url: `https://bk9.site/download/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' },
                { url: `https://bk9.site/download/instagram?url=${encodeURIComponent(url)}`, type: 'instagram' },
                { url: `https://api.maher-zubair.tech/download/tiktok?url=${encodeURIComponent(url)}`, type: 'tiktok' },
                { url: `https://api.maher-zubair.tech/download/instagram?url=${encodeURIComponent(url)}`, type: 'instagram' },
                { url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, type: 'tiktok' } // Last resort specialized
            ];

            let downloadUrl = null;
            let success = false;

            for (const api of apis) {
                // If it's a specific API and doesn't match the platform, skip to save time
                if (api.type !== 'general' && !url.includes(api.type)) continue;

                try {
                    const response = await axios.get(api.url, { timeout: 12000 });
                    const res = response.data;

                    // Ultra-aggressive parsing for different API formats
                    downloadUrl = res.result?.url || res.result?.video || res.result?.hd || res.result?.nowatermark ||
                        res.data?.url || res.data?.video || res.data?.nowm ||
                        res.result?.data?.find(d => d.type === 'video')?.url ||
                        res.result?.data?.[0]?.url ||
                        res.url || (typeof res.result === 'string' && res.result.startsWith('http') ? res.result : null);

                    if (downloadUrl && typeof downloadUrl === 'string' && downloadUrl.startsWith('http')) {
                        success = true;
                        log.info(`✅ Video acquired via ${api.type} API: ${api.url.split('?')[0]}`);
                        break;
                    }
                } catch (e) {
                    log.debug(`Downloader fallback failed for ${api.url.split('?')[0]}: ${e.message}`);
                    continue;
                }
            }

            if (success && downloadUrl) {
                // Download the video buffer to ensure it works (bypass header blocks)
                const videoResponse = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                        'Referer': 'https://www.tiktok.com/'
                    },
                    timeout: 30000
                });

                const buffer = Buffer.from(videoResponse.data);

                await bot.sendMessage(chatId, {
                    video: buffer,
                    caption: `✅ C'est prêt bg ! Flow Psycho Bo 🤙⚡\n🔗 ${url}`
                }, { quoted: message });
                return true;
            } else {
                throw new Error('All APIs failed');
            }
        } catch (error) {
            log.error(`Video download failed for ${url}: ${error.message}`);
            // If it's a timeout or axios error, give more specific feedback
            const isTimeout = error.code === 'ECONNABORTED';
            const errorMsg = isTimeout
                ? "Désolé bg, la connexion au serveur de téléchargement a expiré. ⏳ Réessaie dans quelques instants !"
                : "Désolé bg, j'arrive pas à graille cette vidéo. Elle est peut-être privée ou le lien est mort. 💀";

            await bot.sendMessage(chatId, { text: errorMsg }, { quoted: message });
        }
        return false;
    }
}

module.exports = new LinkHandler();
