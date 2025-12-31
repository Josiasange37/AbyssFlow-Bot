const { log } = require('../utils/logger');

module.exports = {
    name: 'phishscare',
    description: '🛡️ Phish-Scare: Sends a fake security alert about a new login from a hostile location.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const alertText = `
⚠️ *ALERTE DE SÉCURITÉ WHATSAPP*
________________________________

Une nouvelle connexion à votre compte a été détectée.

*Appareil:* Desktop (Chrome / Linux x64)
*Localisation:* Tehran, Iran (IP: 91.239.130.45)
*Date:* ${new Date().toLocaleString()}

Si ce n'était pas vous, votre session est actuellement sous le contrôle de l'Auditeur AbyssFlow. Les clés de chiffrement sont en cours de rotation.

🔒 *Statut:* COMPROMIS
________________________________
_AbyssFlow-Bot v2.8 - Shadow Strike_
`.trim();

            await sock.sendMessage(target, {
                text: alertText,
                contextInfo: {
                    externalAdReply: {
                        title: "Security Alert: New Login Detected",
                        body: "Verify your active sessions immediately.",
                        mediaType: 1,
                        thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png",
                        sourceUrl: "https://whatsapp.com/security/alerts"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `🛡️ *PHISH-SCARE DÉPLOYÉ* sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in PHISHSCARE:', error);
        }
    }
};
