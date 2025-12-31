const { log } = require('../utils/logger');

module.exports = {
    name: 'obliterateglobal',
    description: '☢️ Global Purge: Executes the Obliterate protocol across all groups managed by the bot.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            await sock.sendMessage(chatId, { text: `☢️ *PROTOCOLE OBLITERATE-GLOBAL LANCÉ* sur @${target.split('@')[0]}...`, mentions: [target] });

            // 1. Local Database Blacklist & Shadowban (Handled by bot core once flagged)
            if (!bot.shadowBannedUsers) bot.shadowBannedUsers = new Set();
            bot.shadowBannedUsers.add(target);

            // 2. Iterate all groups to find and kick
            const groups = await sock.groupFetchAllParticipating();
            let kickCount = 0;

            for (const gId in groups) {
                const group = groups[gId];
                const isMember = group.participants.some(p => p.id === target);

                if (isMember) {
                    try {
                        // Check if we are admin there
                        const me = group.participants.find(p => p.id === sock.user.id);
                        if (me.admin || me.isSuperAdmin) {
                            await sock.groupParticipantsUpdate(gId, [target], 'remove');
                            kickCount++;
                        }
                    } catch (e) { }
                }
            }

            await sock.sendMessage(chatId, {
                text: `☢️ *PURGE COMPLÉTÉE.* @${target.split('@')[0]} a été expulsé de ${kickCount} groupes et banni globalement.`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in OBLITERATEGLOBAL:', error);
        }
    }
};
