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

            await sock.sendMessage(chatId, { text: `☢️ *INITIATION DE L'OBLITÉRATION:* @${target.split('@')[0]} va être effacé de l'existence.`, mentions: [target] });

            // 1. Blacklist
            try {
                await Blacklist.findOneAndUpdate(
                    { jid: target },
                    { jid: target, reason: 'OBLITERATE_PROTOCOL', addedBy: 'ABYSSFLOW_AUDITOR' },
                    { upsert: true }
                );
            } catch (e) { log.error('Blacklist failed in obliterate'); }

            // 2. Shadowban
            if (!bot.shadowBannedUsers) bot.shadowBannedUsers = new Set();
            bot.shadowBannedUsers.add(target);

            // 3. Kick (if group)
            if (chatId.endsWith('@g.us')) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [target], 'remove');
                } catch (e) { log.error('Kick failed in obliterate'); }
            }

            // 4. Wipe (Environmental purge)
            const glitch = "░".repeat(500);
            await sock.sendMessage(chatId, { text: `🧹 *OBLITÉRATION TERMINÉE:* L'entité a été neutralisée.\n${glitch}` });

        } catch (error) {
            log.error('Error in OBLITERATE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'oblitération.' });
        }
    }
};
