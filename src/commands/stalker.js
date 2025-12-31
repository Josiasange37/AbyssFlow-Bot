const { log } = require('../utils/logger');

module.exports = {
    name: 'stalker',
    description: '👁️ Presence Monitor: Get private alerts when a target comes online or goes offline.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            if (!bot.stalkerList) bot.stalkerList = new Set();

            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (args[0]?.toLowerCase() === 'list') {
                const list = Array.from(bot.stalkerList).map(jid => `- @${jid.split('@')[0]}`).join('\n');
                return await sock.sendMessage(chatId, { text: `👁️ *STALKER LIST:* \n${list || '_Vide_'}`, mentions: Array.from(bot.stalkerList) });
            }

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            if (bot.stalkerList.has(target)) {
                bot.stalkerList.delete(target);
                await sock.sendMessage(chatId, { text: `🛡️ *STALKER DÉSACTIVÉ:* @${target.split('@')[0]} n'est plus pisté.`, mentions: [target] });
            } else {
                bot.stalkerList.add(target);
                // Subscribe to presence updates for this JID
                await sock.presenceSubscribe(target);
                await sock.sendMessage(chatId, { text: `👁️ *STALKER ACTIVÉ:* Je t'alerterai dès que @${target.split('@')[0]} change de statut.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in STALKER command:', error);
        }
    }
};
