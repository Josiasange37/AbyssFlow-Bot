const ogs = require('open-graph-scraper');
const axios = require('axios');
const { log } = require('./logger');
const Brain = require('../core/Brain');

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

            // 1. Resolve short links (vm.tiktok.com, etc.)
            let finalUrl = url;
            try {
                const headRes = await axios.head(url, {
                    maxRedirects: 5,
                    timeout: 5000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                finalUrl = headRes.request?.res?.responseUrl || headRes.headers?.location || url;
                if (finalUrl !== url) log.debug(`Link expanded: ${url} -> ${finalUrl}`);
            } catch (e) {
                log.debug(`Link expansion failed: ${e.message}`);
            }

            // 2. ANALYZE CONTENT TYPE (Avoid assuming everything is a video)
            try {
                const { result } = await ogs({ url: finalUrl });

                // Detection Logic
                const isExplicitVideo =
                    finalUrl.includes('/reel/') ||
                    finalUrl.includes('/watch') ||
                    finalUrl.includes('tiktok.com') || // TikTok is 99% video
                    finalUrl.includes('/video/');

                const hasVideoTags = result.ogVideo || (result.ogType && result.ogType.includes('video'));
                const isArticle = result.ogType === 'article' || result.ogType === 'website';

                // If it looks like an article AND not explicitly a video -> Treat as Website
                if (isArticle && !hasVideoTags && !isExplicitVideo) {
                    log.info(`📄 Link identified as Article/Website, canceling download: ${finalUrl}`);
                    return await this.handleWebsite(bot, chatId, finalUrl, message);
                }

                log.info(`🎬 Link identified as Video Content: ${finalUrl}`);
            } catch (err) {
                log.warn(`Content analysis failed for ${finalUrl}: ${err.message}. Proceeding with download attempt.`);
            }

            // Brute Force API list - including specialized scrapers
            const apis = [
                { url: `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`, type: 'tiktok' },
                { url: `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(finalUrl)}`, type: 'general' },
                { url: `https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(finalUrl)}`, type: 'tiktok' },
                { url: `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(finalUrl)}`, type: 'tiktok' },
                { url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.botcahx.eu.org/api/dowloader/tiktok?url=${encodeURIComponent(finalUrl)}&apikey=PsychoBot`, type: 'tiktok' },
                { url: `https://bk9.site/download/tiktok?url=${encodeURIComponent(finalUrl)}`, type: 'tiktok' },
                { url: `https://bk9.site/download/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.maher-zubair.tech/download/tiktok?url=${encodeURIComponent(finalUrl)}`, type: 'tiktok' },
                { url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(finalUrl)}`, type: 'tiktok' }
            ];

            let downloadUrl = null;
            let videoMetadata = { title: "" };
            let success = false;

            for (const api of apis) {
                // If it's a specific API and doesn't match the platform, skip to save time
                if (api.type !== 'general' && !finalUrl.includes(api.type)) continue;

                try {
                    const response = await axios.get(api.url, {
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    const res = response.data;

                    // Extract Title if possible
                    videoMetadata.title = res.data?.title || res.result?.title || res.title || videoMetadata.title;

                    // Ultra-aggressive parsing for different API formats
                    downloadUrl = res.data?.play || res.data?.hdplay || res.result?.url || res.result?.video || res.result?.hd || res.result?.nowatermark ||
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
                // Generate AI Description
                const aiDescription = await Brain.generateVideoDescription(videoMetadata);

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
                    caption: `🎥 *ANALYSE VIDÉO*\n\n"${aiDescription}"\n\n🔗 ${url}\n⚡ _Flow Psycho Bo God Mode_`
                }, { quoted: message });
                return true;
            } else {
                throw new Error('All APIs failed');
            }
        } catch (error) {
            log.error(`Video download failed for ${url}: ${error.message}`);

            const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
            const errorMsg = isTimeout
                ? "Désolé bg, la connexion au serveur de téléchargement a expiré. ⏳ Réessaie dans quelques instants !"
                : "Désolé bg, j'arrive pas à graille cette vidéo. Elle est peut-être privée ou le lien est mort. 💀";

            await bot.sendMessage(chatId, { text: errorMsg }, { quoted: message });
        }
        return false;
    }
}

module.exports = new LinkHandler();
