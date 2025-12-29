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

        // 2. VIDEO DETECTION
        const isVideo = this.videoDomains.some(domain => url.includes(domain));

        if (isVideo) {
            return await this.handleVideo(bot, chatId, url, message);
        } else {
            return await this.handleWebsite(bot, chatId, url, message);
        }
    }

    async handleImage(bot, chatId, url, message) {
        try {
            await bot.sendMessage(chatId, {
                image: { url },
                caption: `📸 Image récupérée mola ! ⚡\n🔗 ${url}`
            }, { quoted: message });
            return true;
        } catch (e) {
            log.debug(`Direct image send failed: ${e.message}`);
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
            // Refined Detection (Avoid false positives for articles)
            let isDefinitelyVideo = url.includes('/reel/') || url.includes('/watch') || url.includes('tiktok.com') || url.includes('fb.watch');

            // Expand link to check destination
            let finalUrl = url;
            try {
                const headRes = await axios.head(url, { maxRedirects: 5, timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                finalUrl = headRes.request?.res?.responseUrl || headRes.headers?.location || url;
            } catch (e) { }

            try {
                const { result } = await ogs({ url: finalUrl });
                const hasVideoTags = result.ogVideo || (result.ogType && result.ogType.includes('video'));
                const isArticle = result.ogType === 'article' || result.ogType === 'website';

                if (isArticle && !hasVideoTags && !isDefinitelyVideo) {
                    return await this.handleWebsite(bot, chatId, finalUrl, message);
                }
            } catch (err) { }

            await bot.sendMessage(chatId, { text: "🎬 Vidéo détectée ! Je prépare le téléchargement mola... ⏳" }, { quoted: message });

            // Brute Force API list - including specialized scrapers
            const apis = [
                { url: `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`, type: 'tiktok' },
                { url: `https://api.vreden.my.id/api/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://api.botcahx.eu.org/api/dowloader/fbdown?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://bk9.site/download/facebook?url=${encodeURIComponent(finalUrl)}`, type: 'facebook' },
                { url: `https://api.vreden.my.id/api/downloadv2?url=${encodeURIComponent(finalUrl)}`, type: 'general' },
                { url: `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://bk9.site/download/instagram?url=${encodeURIComponent(finalUrl)}`, type: 'instagram' },
                { url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(finalUrl)}`, type: 'tiktok' }
            ];

            let downloadUrl = null;
            let videoMetadata = { title: "" };
            let success = false;

            for (const api of apis) {
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
                    caption: `🎥 *ANALYSE VIDÉO*\n\n"${aiDescription}"\n\n🔗 ${url}\n⚡ _Flow Psycho Bo God Mode_`
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
