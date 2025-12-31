const { log } = require('../utils/logger');

module.exports = {
    name: 'shadowban',
    description: '👻 Shadow Ban: The bot completely ignores the target and stealthily flags them.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* Répond ou mentionne la cible pour le "shadowban".' });
            }

            if (!bot.shadowBannedUsers) bot.shadowBannedUsers = new Set();

            if (bot.shadowBannedUsers.has(target)) {
                bot.shadowBannedUsers.delete(target);
                return await sock.sendMessage(chatId, { text: `🛡️ *CESSEZ-LE-FEU:* @${target.split('@')[0]} est sorti de l'ombre.`, mentions: [target] });
            }

            bot.shadowBannedUsers.add(target);

            await sock.sendMessage(chatId, {
                text: `👻 *PROTOCOLE SHADOW-BAN ACTIVÉ* 👻\n\n👤 *Cible:* @${target.split('@')[0]}\n🚩 *Status:* IGNORANCE ABSOLUE\n\n_Le bot cessera toute interaction avec cette cible._`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in SHADOWBAN command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du shadow-ban.' });
        }
    }
};
