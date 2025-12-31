const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'totalsilence',
    aliases: ['silence', 'purge'],
    description: '☢️ The Omega Event: Purges EVERY non-admin from the group instantly.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot, isGroup }) {
        if (!isGroup) return;
        try {
            const isBotAdmin = await bot.isBotGroupAdmin(chatId);
            if (!isBotAdmin) return await sock.sendMessage(chatId, { text: '❌ Droits d\'admin requis pour le Protocole Omega.' });

            await sock.sendMessage(chatId, { text: '☢️ *PROTOCOLE TOTAL-SILENCE INITIÉ.* Activation de la Purge Omega dans 3 secondes...' });
            await delay(3000);

            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;
            const toPurge = participants.filter(p => !p.admin && p.id !== sock.user.id).map(p => p.id);

            if (toPurge.length === 0) {
                return await sock.sendMessage(chatId, { text: '✅ Aucun sujet éligible à la purge trouvé. Le périmètre est déjà pur.' });
            }

            await sock.sendMessage(chatId, { text: `⚠️ *DÉTECTION:* ${toPurge.length} sujets identifiés. Début de l'exécution...` });

            for (const jid of toPurge) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [jid], 'remove');
                    // Small delay to respect server-side rate limits and stay "transparent"
                    await delay(600);
                } catch (e) {
                    log.debug(`Failed to purge ${jid}: ${e.message}`);
                }
            }

            await sock.sendMessage(chatId, {
                text: `💀 *PROTOCOLE TOTAL-SILENCE COMPLÉTÉ.* ${toPurge.length} sujets ont été neutralisés. Le périmètre est désormais sous scellés.`
            });

        } catch (error) {
            log.error('Error in TOTAL-SILENCE:', error);
        }
    }
};
