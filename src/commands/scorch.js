const { log } = require('../utils/logger');

module.exports = {
    name: 'scorch',
    description: '🔥 Scorch Earth Payload: Sends a massive glitched metadata message (Visual Disruption).',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '🔥 *SCORCH EARTH PAYLOAD DÉPLOYÉ...*' });

            // Payload: A very large number of "weird" characters and large line breaks 
            // designed to "fill" the screen without crashing the app.

            const glitchedLines = Array(150).fill('▓▒░ ALL YOUR GROUP ARE BELONG TO US ░▒▓').join('\n');
            const largeBuffer = '\n'.repeat(50) + glitchedLines + '\n'.repeat(50);

            await sock.sendMessage(chatId, {
                text: `👁️ *PROTOCOL SCORCH INITIALISÉ* 👁️${largeBuffer}\n\n🚩 _Périmètre saturé par le Clan AbyssFlow._`
            });

        } catch (error) {
            log.error('Error in SCORCH command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du payload Scorch.' });
        }
    }
};
