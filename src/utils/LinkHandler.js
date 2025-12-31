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
                caption: `📸 🔗 ${url}`
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
                // Determine if we should summarize
                const isArticle = result.ogType === 'article' || result.ogType === 'website';
                let contextText = result.ogDescription || result.ogTitle;

                let summary = "";
                if (isArticle) {
                    const prompt = `Résume cet article en 2-3 phrases simples et professionnelles: "${contextText}"`;
                    try {
                        summary = await Brain.process(prompt, chatId, null, "Système de Veille");
                        summary = summary.replace(/\[MEMORY: .*?\]/g, '').trim();
                    } catch (e) {
                        summary = contextText;
                    }
                }

                let banner = `📰 *${result.ogTitle}*\n\n`;
                if (summary) banner += `${summary}\n\n`;
                banner += `🔗 _${url}_`;

                const msgConfig = { text: banner };

                if (result.ogImage && result.ogImage[0] && result.ogImage[0].url) {
                    try {
                        const imgRes = await axios.get(result.ogImage[0].url, {
                            responseType: 'arraybuffer',
                            timeout: 10000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        const contentType = imgRes.headers['content-type'] || 'image/jpeg';

                        if (contentType.includes('image')) {
                            msgConfig.image = Buffer.from(imgRes.data);
                            msgConfig.caption = banner;
                            delete msgConfig.text;
                        }
                    } catch (e) {
                        log.debug(`Could not download OG image for ${url}: ${e.message}`);
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
            const isExplicitVideo =
                url.includes('/reel/') ||
                url.includes('/watch') ||
                url.includes('/shorts/') ||
                url.includes('tiktok.com') ||
                url.includes('fb.watch') ||
                url.includes('/videos/');

            let finalUrl = url;
            try {
                const headRes = await axios.head(url, { maxRedirects: 3, timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                finalUrl = headRes.request?.res?.responseUrl || headRes.headers?.location || url;
            } catch (e) { }

            try {
                const { result } = await ogs({ url: finalUrl });
                const hasVideoTags = result.ogVideo || (result.ogType && result.ogType.includes('video'));
                const isArticle = result.ogType === 'article' || result.ogType === 'website';

                if (isArticle && !hasVideoTags && !isExplicitVideo) {
                    return await this.handleWebsite(bot, chatId, finalUrl, message);
                }
            } catch (err) { }

            // Silent preparation
            const apis = [
                { url: `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`, type: 'tiktok' },
                { url: `https://api.vreden.my.id/api/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://api.botcahx.eu.org/api/dowloader/fbdown?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://api.botcahx.eu.org/api/dowloader/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://bk9.site/download/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://bk9.site/download/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(finalUrl)}`, type: 'youtube' },
                { url: `https://api.agatz.xyz/api/ytv?url=${encodeURIComponent(finalUrl)}`, type: 'youtube' },
                { url: `https://api.botcahx.eu.org/api/dowloader/ytv?url=${encodeURIComponent(finalUrl)}`, type: 'youtube' },
                { url: `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(finalUrl)}`, type: 'general' }
            ];

            let downloadUrl = null;
            let videoMetadata = { title: "" };
            let success = false;

            for (const api of apis) {
                const isMatch = api.type === 'general' ||
                    finalUrl.toLowerCase().includes(api.type) ||
                    (api.type === 'youtube' && finalUrl.toLowerCase().includes('youtu.be')) ||
                    (api.type === 'facebook' && (finalUrl.toLowerCase().includes('fb.watch') || finalUrl.toLowerCase().includes('fb.me')));

                if (!isMatch) continue;

                try {
                    const response = await axios.get(api.url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const res = response.data;
                    videoMetadata.title = res.data?.title || res.result?.title || res.title || videoMetadata.title;
                    downloadUrl = res.data?.play || res.data?.hdplay || res.result?.url || res.result?.video || res.result?.hd ||
                        res.result?.download || res.data?.url || res.data?.video || res.url ||
                        (typeof res.result === 'string' && res.result.startsWith('http') ? res.result : null);

                    if (downloadUrl && typeof downloadUrl === 'string' && downloadUrl.startsWith('http')) {
                        success = true;
                        break;
                    }
                } catch (e) { continue; }
            }

            if (success && downloadUrl) {
                const videoResponse = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 45000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const buffer = Buffer.from(videoResponse.data);
                const contentType = videoResponse.headers['content-type'] || '';
                const mediaType = contentType.includes('image') ? 'image' : 'video';

                await bot.sendMessage(chatId, {
                    [mediaType]: buffer,
                    caption: `🎬 ${videoMetadata.title || "Média"} • _AbyssFlow Auditor_`
                }, { quoted: message });
                return true;
            }
        } catch (error) {
            log.debug(`Silent fail: ${error.message}`);
        }
        return false;
    }
}

module.exports = new LinkHandler();
