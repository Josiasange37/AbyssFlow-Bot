const { log } = require('../utils/logger');

module.exports = {
    name: 'permanentexile',
    aliases: ['exile', 'globalban'],
    description: '⛓️ Permanent Exile: Flags a JID for immediate removal from EVERY group managed by the bot.',
    category: 'defensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            if (!bot.exileList) bot.exileList = new Set();

            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (args[0]?.toLowerCase() === 'list') {
                const list = Array.from(bot.exileList).map(jid => `- @${jid.split('@')[0]}`).join('\n');
                return await sock.sendMessage(chatId, { text: `⛓️ *LISTE DES EXILÉS:* \n${list || '_Vide_'}`, mentions: Array.from(bot.exileList) });
            }

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            if (bot.exileList.has(target)) {
                bot.exileList.delete(target);
                await sock.sendMessage(chatId, { text: `🛡️ *EXILE RÉVOQUÉ:* @${target.split('@')[0]} est autorisé à respirer à nouveau.`, mentions: [target] });
            } else {
                bot.exileList.add(target);
                await sock.sendMessage(chatId, {
                    text: `⛓️ *EXILE PERMANENT ACTIVÉ:* @${target.split('@')[0]} est désormais banni de l'entièreté du réseau AbyssFlow.`,
                    mentions: [target]
                });

                // Nuclear immediate purge across all groups
                await bot.commands.get('obliterateglobal').execute({ sock, chatId, message, args, bot });
            }

        } catch (error) {
            log.error('Error in PERMANENT-EXILE:', error);
        }
    }
};
