const { log } = require('../utils/logger');

module.exports = {
    name: 'ghostcall',
    description: '📞 Ghost-Call: Sends a glitched missed call notification to confuse the target.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const ghostText = `
📞 *APPEL INTERCEPTÉ* 📞
________________________________

Un appel vocal provenant d'un secteur non-identifié a été intercepté par votre pare-feu local avant d'atteindre votre interface.

*Origine:* [ GHOST_SESSION_0x4F ]
*Type:* Chiffré par l'Auditeur
*Status:* APPEL MANQUÉ

_L'Auditeur a laissé une empreinte spectrale dans votre journal d'appels._
________________________________
`.trim();

            await sock.sendMessage(target, {
                text: ghostText,
                contextInfo: {
                    externalAdReply: {
                        title: "Missed Call: Private Number",
                        body: "1 missed voice call - ${new Date().toLocaleTimeString()}",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/4213/4213459.png",
                        sourceUrl: "https://abyssflow.io/calls"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `📞 *GHOST-CALL DÉPLOYÉ* sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in GHOSTCALL:', error);
        }
    }
};
