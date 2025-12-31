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

            const normalizedTarget = bot.normalizeJid(target);
            await sock.sendMessage(chatId, { text: `☢️ *PROTOCOLE OBLITERATE-GLOBAL LANCÉ* sur @${target.split('@')[0]}...`, mentions: [target] });

            // 1. Persistent Blacklist & Shadowban (Sovereign Level)
            try {
                const Blacklist = require('../database/models/Blacklist');
                await Blacklist.findOneAndUpdate(
                    { userId: target },
                    { userId: target, reason: 'GLOBAL_OBLITERATION', addedBy: 'ABYSSFLOW_SOVEREIGN' },
                    { upsert: true }
                );
                if (bot.exileList) bot.exileList.add(target);
                if (normalizedTarget && bot.exileList) bot.exileList.add(normalizedTarget);
            } catch (e) { log.error('Blacklist failed in obliterate-global'); }

            if (!bot.shadowBannedUsers) bot.shadowBannedUsers = new Set();
            bot.shadowBannedUsers.add(target);
            bot.shadowBannedUsers.add(normalizedTarget);

            // 2. Global Scan & Purge (Recursive Sector Clear)
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);

            let kickCount = 0;
            for (const group of groupList) {
                const isMember = group.participants.some(p => p.id.split(':')[0] === target.split(':')[0]);
                if (isMember) {
                    try {
                        const me = group.participants.find(p => p.id.split(':')[0] === (sock.user.id.split(':')[0]));
                        if (me && (me.admin || me.isSuperAdmin)) {
                            await sock.groupParticipantsUpdate(group.id, [target], 'remove');
                            kickCount++;
                            await delay(800);
                        }
                    } catch (e) { /* Permission denied */ }
                }
            }

            await sock.sendMessage(chatId, {
                text: `☢️ *GLOBAL PURGE TERMINÉE:* ${kickCount} Nodes neutralisés.\n⚠️ *STATUT:* @${target.split('@')[0]} est désormais persona non grata sur l'entité AbyssFlow.\n\n_Le protocole souverain est immuable._`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in OBLITERATEGLOBAL:', error);
        }
    }
};
