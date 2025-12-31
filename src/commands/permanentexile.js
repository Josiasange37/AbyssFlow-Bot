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

            const Blacklist = require('../database/models/Blacklist');
            const normalizedTarget = target.split(':')[0].split('@')[0];

            if (bot.exileList.has(target) || bot.exileList.has(normalizedTarget)) {
                bot.exileList.delete(target);
                bot.exileList.delete(normalizedTarget);
                await Blacklist.deleteOne({ $or: [{ userId: target }, { userId: normalizedTarget }] });

                await sock.sendMessage(chatId, { text: `🛡️ *EXILE RÉVOQUÉ:* @${target.split('@')[0]} est autorisé à respirer à nouveau.`, mentions: [target] });
            } else {
                const reason = args.slice(1).join(' ') || 'Violations massives du protocole AbyssFlow.';
                bot.exileList.add(target);

                await Blacklist.findOneAndUpdate(
                    { userId: target },
                    { userId: target, reason: reason, addedBy: message.key.participant || message.key.remoteJid },
                    { upsert: true }
                );

                await sock.sendMessage(chatId, {
                    text: `⛓️ *EXILE PERMANENT ACTIVÉ:* @${target.split('@')[0]} est désormais banni de l'entièreté du réseau AbyssFlow.\n\n*Raison:* ${reason}`,
                    mentions: [target]
                });

                // Nuclear immediate purge across all groups
                const obliterate = bot.commands.get('obliterateglobal');
                if (obliterate) {
                    await obliterate.execute({ sock, chatId, message, args: [target], bot });
                }
            }

        } catch (error) {
            log.error('Error in PERMANENT-EXILE:', error);
        }
    }
};
