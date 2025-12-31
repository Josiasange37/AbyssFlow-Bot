const { log } = require('../utils/logger');

module.exports = {
    name: 'spoofalert',
    description: '☢️ Social Engineering Attack: Sends a fake official WhatsApp Security alert to the target.',
    category: 'offensive',
    isAdmin: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const alertText = `
⚠️ *WHATSAPP SECURITY ALERT* ⚠️

Your account has been flagged for violating our **Terms of Service (Section 4.2 - Automated Activity)**.
A manual review of your communication has been initiated by the server-side auditor.

*Case ID:* #AF-${Math.floor(Math.random() * 90000) + 10000}
*Status:* PENDING SUSPENSION

To contest this decision, do not reply to this automated message.
________________________________
_© 2025 WhatsApp LLC - Security Division_
`.trim();

            await sock.sendMessage(target, {
                text: alertText,
                contextInfo: {
                    externalAdReply: {
                        title: "WhatsApp Security Center",
                        body: "Account Status: Under Review",
                        mediaType: 1,
                        thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png",
                        sourceUrl: "https://www.whatsapp.com/security"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `☢️ *SPOOF-ALERT ENVOYÉ:* La cible @${target.split('@')[0]} a reçu l'avis de suspension.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in SPOOFALERT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'attaque Spoof.' });
        }
    }
};
