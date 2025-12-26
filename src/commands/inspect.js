const UserStats = require('../database/models/UserStats');
const sharp = require('sharp');
const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
    name: 'inspect',
    aliases: ['whois', 'profil', 'report'],
    description: 'Get a visual intelligence report on a member',
    isGroupOnly: true,
    async execute({ chatId, bot, message, args }) {
        try {
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] && args[0].includes('@') ? args[0] : null);

            const target = mentioned || message.key.participant || message.key.remoteJid;

            await bot.sendMessage(chatId, { text: "🔍 Analyse tactique en cours... 💾" }, { quoted: message });

            const stats = await UserStats.findOne({ userId: target, groupId: chatId }) || { level: 1, xp: 0, messagesCount: 0 };
            const nextLevelXp = stats.level * 100;
            const progress = (stats.xp / nextLevelXp) * 100;
            const rank = await UserStats.countDocuments({ groupId: chatId, level: { $gt: stats.level } }) + 1;

            // Get PFP
            let ppBuffer;
            try {
                const ppUrl = await bot.sock.profilePictureUrl(target, 'image');
                const ppResponse = await axios.get(ppUrl, { responseType: 'arraybuffer' });
                ppBuffer = Buffer.from(ppResponse.data);
            } catch (e) {
                // Fallback empty circle or generic avatar
                ppBuffer = Buffer.from(`<svg width="200" height="200"><circle cx="100" cy="100" r="100" fill="#333"/></svg>`);
            }

            // Generate Image
            const width = 800;
            const height = 400;

            const svgCard = `
            <svg width="${width}" height="${height}">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#141e30;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#243b55;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)" rx="20" />
                
                <text x="250" y="60" font-family="Arial" font-size="30" fill="#e94560" font-weight="bold">INTELLIGENCE REPORT</text>
                <text x="250" y="100" font-family="Arial" font-size="20" fill="#fff">ID: @${target.split('@')[0]}</text>
                
                <text x="250" y="160" font-family="Arial" font-size="18" fill="#aaa">NIVEAU</text>
                <text x="250" y="200" font-family="Arial" font-size="40" fill="#fff" font-weight="bold">${stats.level}</text>
                
                <text x="450" y="160" font-family="Arial" font-size="18" fill="#aaa">RANG DU CLAN</text>
                <text x="450" y="200" font-family="Arial" font-size="40" fill="#f1c40f" font-weight="bold">#${rank}</text>
                
                <text x="250" y="260" font-family="Arial" font-size="18" fill="#aaa">PROGRESSION XP</text>
                <rect x="250" y="280" width="500" height="25" fill="rgba(255,255,255,0.1)" rx="12" />
                <rect x="250" y="280" width="${(progress / 100) * 500}" height="25" fill="#e94560" rx="12" />
                <text x="250" y="330" font-family="Arial" font-size="16" fill="#00d2ff">${stats.xp} / ${nextLevelXp} XP</text>
                
                <text x="40" y="370" font-family="Arial" font-size="14" fill="#666">Xyber-Elite Intelligence System v2.0</text>
            </svg>`;

            const circlePp = await sharp(ppBuffer)
                .resize(180, 180)
                .composite([{
                    input: Buffer.from('<svg><circle cx="90" cy="90" r="90" /></svg>'),
                    blend: 'dest-in'
                }])
                .png()
                .toBuffer();

            const finalBuffer = await sharp(Buffer.from(svgCard))
                .composite([{ input: circlePp, top: 40, left: 40 }])
                .png()
                .toBuffer();

            await bot.sendMessage(chatId, {
                image: finalBuffer,
                caption: `📑 *RAPPORT D'INTELLIGENCE : @${target.split('@')[0]}* 📑\n\n🏅 *Niveau:* ${stats.level}\n🏆 *Rang:* #${rank}\n💬 *Messages:* ${stats.messagesCount}\n✨ *XP:* ${stats.xp}/${nextLevelXp}\n\n_Dossier tactique généré par Psycho Bo._ 🤙⚔️`,
                mentions: [target]
            }, { quoted: message });

        } catch (error) {
            log.error('Inspect command failed:', error.message);
            await bot.sendMessage(chatId, { text: "Impossible de générer le rapport tactique mola... 🛠️" }, { quoted: message });
        }
    }
};
