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
            await sock.sendMessage(chatId, { text: `🧹 *INITIATION DU PROTOCOLE WIPE:* Nettoyage de l'environnement AbyssFlow...` });

            const glitch = "░".repeat(1000);
            const payloads = [
                `W̴̛̙I̶̪̅P̵̮͋E̴̮̚\n${glitch}`,
                `E̴̮̚R̴̠͝A̶̙͠S̵̪̉U̴̠͝R̴̠͝E̴̮̚\n${glitch}`,
                `N̵̛̙E̵̮̚U̵̠͝T̵̮͋R̵̠͝A̵̙͠L̵̪̉I̵̠̎Z̵̠͝A̶̙͠T̵̮͋I̵̠̎O̵̠͝N̵̛̙\n${glitch}`
            ];

            for (const p of payloads) {
                await sock.sendMessage(chatId, { text: p });
                await delay(500);
            }

            await sock.sendMessage(chatId, { text: `✅ *ENVIRONNEMENT PURGÉ.* Toute trace de pollution a été neutralisée.` });

        } catch (error) {
            log.error('Error in WIPE command:', error);
        }
    }
};
