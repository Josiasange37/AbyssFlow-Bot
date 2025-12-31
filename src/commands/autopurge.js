const { log } = require('../utils/logger');

module.exports = {
    name: 'autopurge',
    description: '🛡️ Zero-Tolerance: Instantly kicks non-admins who send links or restricted content.',
    category: 'defensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot, args }) {
        try {
            if (!bot.autoPurgeChats) bot.autoPurgeChats = new Set();

            if (bot.autoPurgeChats.has(chatId)) {
                bot.autoPurgeChats.delete(chatId);
                await sock.sendMessage(chatId, { text: '🛡️ *AUTO-PURGE DÉSACTIVÉ:* L\'Auditeur redevient flexible.' });
            } else {
                bot.autoPurgeChats.add(chatId);
                await sock.sendMessage(chatId, {
                    text: '🛡️ *AUTO-PURGE ACTIVÉ:* Tolérance Zéro. Tout lien ou spam par un non-admin entraînera une expulsion immédiate.'
                });
            }

        } catch (error) {
            log.error('Error in AUTOPURGE command:', error);
        }
    }
};
