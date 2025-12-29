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

        // 1. IMAGE DETECTION (Direct Links)
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        if (imageExtensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext))) {
            return await this.handleImage(bot, chatId, url, message);
        }

        // 2. VIDEO DETECTION (Known Domains)
        const isVideoDomain = this.videoDomains.some(domain => url.includes(domain));

        if (isVideoDomain) {
            return await this.handleVideo(bot, chatId, url, message);
        } else {
            return await this.handleWebsite(bot, chatId, url, message);
        }
    }

    async handleImage(bot, chatId, url, message) {
        try {
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            const buffer = Buffer.from(res.data);

            await bot.sendMessage(chatId, {
                image: buffer,
                caption: `📸 Image récupérée ! ⚡\n🔗 ${url}`
            }, { quoted: message });
            return true;
        } catch (e) {
            log.debug(`Direct image download failed: ${e.message}`);
            return await this.handleWebsite(bot, chatId, url, message);
        }
    }

    async handleWebsite(bot, chatId, url, message) {
        try {
            const { result } = await ogs({ url });

            if (result.success && result.ogTitle) {
                let banner = `📰 *${result.ogTitle}*\n\n`;
                if (result.ogDescription) banner += `${result.ogDescription}\n\n`;
                banner += `🔗 _${url}_`;

                const msgConfig = { text: banner };

                // Try to get OG Image as buffer to avoid "Video" bug on mobile
                if (result.ogImage && result.ogImage[0] && result.ogImage[0].url) {
                    try {
                        const imgRes = await axios.get(result.ogImage[0].url, { responseType: 'arraybuffer', timeout: 8000 });
                        msgConfig.image = Buffer.from(imgRes.data);
                        msgConfig.caption = banner;
                        delete msgConfig.text;
                    } catch (e) {
                        log.debug(`Could not download OG image buffer for ${url}: ${e.message}`);
                    }
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
            // Explicit check for known video paths to avoid article confusion
            const isExplicitVideo =
                url.includes('/reel/') ||
                url.includes('/watch') ||
                url.includes('/shorts/') ||
                url.includes('tiktok.com') ||
                url.includes('fb.watch') ||
                url.includes('/videos/');

            // Expand link to check destination
            let finalUrl = url;
            try {
                const headRes = await axios.head(url, { maxRedirects: 3, timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                finalUrl = headRes.request?.res?.responseUrl || headRes.headers?.location || url;
            } catch (e) { }

            // Content Analysis via OG
            try {
                const { result } = await ogs({ url: finalUrl });
                const hasVideoTags = result.ogVideo || (result.ogType && result.ogType.includes('video'));
                const isArticle = result.ogType === 'article' || result.ogType === 'website';

                // If it looks like an article AND no explicit video hints -> Fallback to Website (Banner)
                if (isArticle && !hasVideoTags && !isExplicitVideo) {
                    log.info(`📄 Filtering out article disguised as video: ${finalUrl}`);
                    return await this.handleWebsite(bot, chatId, finalUrl, message);
                }
            } catch (err) { }

            await bot.sendMessage(chatId, { text: "🎬 Vidéo détectée ! Je prépare le téléchargement... ⏳" }, { quoted: message });

            const apis = [
                { url: `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`, type: 'tiktok' },
                { url: `https://api.vreden.my.id/api/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://api.botcahx.eu.org/api/dowloader/fbdown?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://bk9.site/download/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://bk9.site/download/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(finalUrl)}`, type: 'general' }
            ];

            let downloadUrl = null;
            let videoMetadata = { title: "" };
            let success = false;

            for (const api of apis) {
                // Optimization: only hit platform-matching APIs
                if (api.type !== 'general' && !finalUrl.toLowerCase().includes(api.type)) continue;

                try {
                    const response = await axios.get(api.url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const res = response.data;

                    videoMetadata.title = res.data?.title || res.result?.title || res.title || videoMetadata.title;

                    downloadUrl = res.data?.play || res.data?.hdplay || res.result?.url || res.result?.video || res.result?.hd ||
                        res.data?.url || res.data?.video || res.url ||
                        (typeof res.result === 'string' && res.result.startsWith('http') ? res.result : null);

                    if (downloadUrl && typeof downloadUrl === 'string' && downloadUrl.startsWith('http')) {
                        success = true;
                        break;
                    }
                } catch (e) { continue; }
            }

            if (success && downloadUrl) {
                const aiDescription = await Brain.generateVideoDescription(videoMetadata);
                const videoResponse = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 45000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                await bot.sendMessage(chatId, {
                    video: Buffer.from(videoResponse.data),
                    caption: `🎥 *ANALYSE VIDÉO*\n\n"${aiDescription}"\n\n🔗 ${url}\n⚡ _Flow Psycho Bot_`
                }, { quoted: message });
                return true;
            } else {
                throw new Error('All APIs failed');
            }
        } catch (error) {
            log.error(`Video download failed for ${url}: ${error.message}`);
            await bot.sendMessage(chatId, { text: "Désolé bg, j'arrive pas à graille cette vidéo. Elle est peut-être privée ou le lien est mort. 💀" }, { quoted: message });
        }
        return false;
    }
}

module.exports = new LinkHandler();
