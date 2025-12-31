const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');
const Blacklist = require('../database/models/Blacklist');

module.exports = {
    name: 'obliterate',
    description: '☢️ The Final Solution: Kicks, Blacklists, Shadowbans, and Wipes the chat for a specific target.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante pour l\'oblitération.' });

            const normalizedTarget = bot.normalizeJid(target);

            await sock.sendMessage(chatId, { text: `☢️ *INITIATION DE L'OBLITÉRATION:* @${target.split('@')[0]} va être effacé de l'existence.`, mentions: [target] });

            // 1. Blacklist (Persistent & Normalized)
            try {
                const Blacklist = require('../database/models/Blacklist');
                await Blacklist.findOneAndUpdate(
                    { userId: target },
                    { userId: target, reason: 'OBLITERATE_PROTOCOL', addedBy: 'ABYSSFLOW_SOVEREIGN' },
                    { upsert: true }
                );
                if (bot.exileList) bot.exileList.add(target);
                if (normalizedTarget && bot.exileList) bot.exileList.add(normalizedTarget);
            } catch (e) { log.error('Blacklist failed in obliterate'); }

            // 2. Shadowban
            if (!bot.shadowBannedUsers) bot.shadowBannedUsers = new Set();
            bot.shadowBannedUsers.add(target);
            bot.shadowBannedUsers.add(normalizedTarget);

            // 3. Protocol Wipe (Spamming blank messages to target privately if possible, or in group)
            const padding = '\u200B'.repeat(4000);
            for (let i = 0; i < 3; i++) {
                await sock.sendMessage(chatId, { text: `[SYSTEM_WIPE_STREAK_${i}]\n${padding}` });
            }

            // 4. Kick (if group)
            if (chatId.endsWith('@g.us')) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [target], 'remove');
                } catch (e) { log.error('Kick failed in obliterate'); }
            }

            await sock.sendMessage(chatId, {
                text: `🧹 *PROGESS:* L'entité @${target.split('@')[0]} n'existe plus dans ce secteur.\n\n_Dossier AbyssFlow fermé._`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in OBLITERATE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'oblitération.' });
        }
    }
};
