const { log } = require('../utils/logger');

module.exports = {
    name: 'paralyze',
    description: '🔇 Social Paralyzer: Redacts every message from a target in real-time.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* Répond ou mentionne la cible pour la "paralyser".' });
            }

            if (!bot.paralyzedUsers) bot.paralyzedUsers = new Map();
            let chatParalyzed = bot.paralyzedUsers.get(chatId) || new Set();

            if (chatParalyzed.has(target)) {
                chatParalyzed.delete(target);
                bot.paralyzedUsers.set(chatId, chatParalyzed);
                return await sock.sendMessage(chatId, { text: `🔓 *CIBLE LIBÉRÉE:* @${target.split('@')[0]} peut de nouveau communiquer.`, mentions: [target] });
            }

            chatParalyzed.add(target);
            bot.paralyzedUsers.set(chatId, chatParalyzed);

            await sock.sendMessage(chatId, {
                text: `🔇 *PROTOCOLE PARALYZE ACTIVÉ* 🔇\n\n👤 *Cible:* @${target.split('@')[0]}\n🚩 *Status:* ISOLATION SOCIALE\n\n_Chaque message de cette cible sera immédiatement neutralisé._`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in PARALYZE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du protocole Paralyze.' });
        }
    }
};
