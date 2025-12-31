const { log } = require('../utils/logger');

module.exports = {
    name: 'systemmsg',
    description: '📜 System Spoof: Sends a message styled as an official WhatsApp security notification.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const type = args[0]?.toLowerCase() || 'security';
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[1] ? args[1].replace('@', '') + '@s.whatsapp.net' : chatId);

            let title = "WhatsApp Security";
            let body = "Critical Alert Detected";
            let text = "";
            let thumb = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png";

            if (type === 'security') {
                text = "🛡️ *NOTIFICATIONS SÉCURISÉES:* Le système a détecté une tentative d'accès non autorisé à vos données chiffrées de bout en bout.";
                title = "Security Code Changed";
                body = "Encryption keys modified by external agent.";
            } else if (type === 'ban') {
                text = "🚫 *AVIS DE SUSPENSION:* Ce compte est marqué pour une suspension permanente pour violation des Conditions d'utilisation de WhatsApp.";
                title = "Account Banned";
                body = "Permanent suspension in 24 hours.";
                thumb = "https://cdn-icons-png.flaticon.com/512/3282/3282645.png";
            } else if (type === 'leak') {
                text = "⚠️ *FUITE DE DONNÉES:* Vos informations personnelles ont été exposées dans une base de données publique. AbyssFlow Auditor tente de sécuriser votre périmètre.";
                title = "Privacy Warning";
                body = "Infrastructure Leak Detected.";
            }

            await sock.sendMessage(target, {
                text: text,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: body,
                        mediaType: 1,
                        thumbnailUrl: thumb,
                        sourceUrl: "https://whatsapp.com/security/alert",
                        showAdAttribution: false // Hide 'Ad' label if supported
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `📜 *SPOOF SYSTÈME DÉPLOYÉ* sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in SYSTEMMSG command:', error);
        }
    }
};
