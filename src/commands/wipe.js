const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'wipe',
    description: '🧹 Environmental Erasure: Clears the chat environment with multiple intense glitched payloads.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot }) {
        try {
            const wipeLogs = [
                `🧹 *INITIATING ENVIRONMENTAL NEUTRALIZATION*...`,
                `📡 *SCANNING:* Identifying residual protocol artifacts...`,
                `🔥 *PURGING:* Clearing visual environment cache...`,
                `🔒 *ENFORCING:* Applying Protocol_Silence...`
            ];

            for (const logText of wipeLogs) {
                await sock.sendMessage(chatId, { text: logText });
                await delay(600);
            }

            // Visual suppression sequence (Blank Message Updates)
            const blankMessage = "\u200B".repeat(500);
            for (let i = 0; i < 3; i++) {
                const sent = await sock.sendMessage(chatId, { text: `[PROTOCOL_WIPE_SEQUENCE_${i + 1}]\n${blankMessage}` });
                await delay(300);
                // Attempt to "edit" it to blank for cleaner disappearance simulation if client supports
                try {
                    await sock.sendMessage(chatId, { edit: sent.key, text: " " });
                } catch (e) { }
            }

            await sock.sendMessage(chatId, { text: `✅ *ENVIRONMENTAL PURGE COMPLETE.* Protocol supremacy established.` });

        } catch (error) {
            log.error('Error in WIPE command:', error);
        }
    }
};
