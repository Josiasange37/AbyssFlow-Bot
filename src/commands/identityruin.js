const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'identityruin',
    description: '☣️ Identity Ruin: Clones the target then broadcasts an offensive message as them across the network.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            await sock.sendMessage(chatId, { text: `☣️ *INITIATION DE LA RUINE D'IDENTITÉ:* Préparation du contenu diffamatoire...` });

            // 1. Deep Clone
            await bot.commands.get('clone').execute({ sock, chatId, message, args, bot });
            await delay(2000);

            // 2. Broadcast offensive payload as target
            const targetName = target.split('@')[0];
            const ruinText = `[ SYSTÈME COMPROMIS ]\n\nje suis @${targetName} et j'avoue être une fraude totale. je quitte ce clan par pur lâcheté. l'Auditeur a raison, je ne suis rien. 🖕`;

            // Broadcast to all groups
            const groups = await sock.groupFetchAllParticipating();
            for (const gId in groups) {
                try {
                    await sock.sendMessage(gId, { text: ruinText, mentions: [target] });
                    await delay(1000);
                } catch (e) { }
            }

            await sock.sendMessage(chatId, {
                text: `✅ *RUINE D'IDENTITÉ COMPLÉTÉE.* @${targetName} a été publiquement déshonoré.`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in IDENTITY-RUIN:', error);
        }
    }
};
