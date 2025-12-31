const { log } = require('../utils/logger');

module.exports = {
    name: 'watchdog',
    description: '👁️ Global Surveillance: Flag a JID to be monitored across all chats.',
    category: 'defensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            if (!bot.watchdogList) bot.watchdogList = new Set();

            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (args[0]?.toLowerCase() === 'list') {
                const list = Array.from(bot.watchdogList).map(jid => `- @${jid.split('@')[0]}`).join('\n');
                return await sock.sendMessage(chatId, { text: `👁️ *LISTE WATCHDOG:* \n${list || '_Vide_'}`, mentions: Array.from(bot.watchdogList) });
            }

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            if (bot.watchdogList.has(target)) {
                bot.watchdogList.delete(target);
                await sock.sendMessage(chatId, { text: `🛡️ *WATCHDOG RETIRÉ:* @${target.split('@')[0]} n'est plus sous surveillance.`, mentions: [target] });
            } else {
                bot.watchdogList.add(target);
                await sock.sendMessage(chatId, { text: `👁️ *WATCHDOG ACTIVÉ:* @${target.split('@')[0]} est désormais surveillé globalement.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in WATCHDOG command:', error);
        }
    }
};
