const { log } = require('../utils/logger');

module.exports = {
    name: 'sessionhijack',
    description: '📱 Hijack Spoof: Sends a fake "Linked Device" notification to the target.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const hijackText = `
📱 *NOUVEL APPAREIL ASSOCIÉ*
________________________________

Un nouvel appareil a été associé à votre compte WhatsApp.

*Appareil:* AbyssFlow Auditor (Linux v2.6.4)
*Localisation:* [ INTERCEPTÉ PAR PROXY ]
*Date:* ${new Date().toLocaleString()}

Si vous n'êtes pas à l'origine de cette association, l'Auditeur a déjà commencé l'exfiltration de vos clés de session.

⚠️ *Action:* Ne tentez pas de déconnexion forcée sous peine de corruption complète des fichiers locaux.
________________________________
_Sovereignty of the AbyssFlow Clan._
`.trim();

            await sock.sendMessage(target, {
                text: hijackText,
                contextInfo: {
                    externalAdReply: {
                        title: "WhatsApp Security: New Device Linked",
                        body: "Verify your active sessions immediately.",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/3282/3282645.png",
                        sourceUrl: "https://whatsapp.com/security/devices"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `📱 *HIJACK SIMULATION DÉPLOYÉE* sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in SESSIONHIJACK command:', error);
        }
    }
};
