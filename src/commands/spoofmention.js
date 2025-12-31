const { log } = require('../utils/logger');

module.exports = {
    name: 'spoofmention',
    description: '📢 Spoof-Mention: Sends a fake alert that the user was tagged in a hostile or "banned" group.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const spoofText = `
📢 *NOTIFICATION DE MENTION*
________________________________

Vous avez été mentionné dans le groupe :
📛 *HOSTILE_RECON_CELL_09*

*Raison:* Target Identification for Protocol Erasure.
*Action:* Vos métadonnées sont en cours de transfert vers le serveur de l'Auditeur.

⚠️ *Attention:* Toute tentative de quitter le groupe ou de bloquer l'entité résultera en une accélération du processus.
________________________________
_Sovereignty of the AbyssFlow Clan._
`.trim();

            await sock.sendMessage(target, {
                text: spoofText,
                contextInfo: {
                    externalAdReply: {
                        title: "You were tagged in: HOSTILE_RECON",
                        body: "Analyzing target identity...",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/2622/2622075.png",
                        sourceUrl: "https://abyssflow.io/tags"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `📢 *SPOOF-MENTION ENVOYÉ* sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in SPOOFMENTION:', error);
        }
    }
};
