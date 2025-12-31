const { log } = require('../utils/logger');

module.exports = {
    name: 'ghosttag',
    description: '👻 Invisible Mention Payload: Tags every member without showing their names.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants.map(p => p.id);

            // Payload: A very small character + mentions in contextInfo
            // This triggers a notification for everyone without a huge wall of names.

            await sock.sendMessage(chatId, {
                text: '👻 *SOMMONS LES OMBRES.* \n(Signal de présence du Clan AbyssFlow envoyé)',
                mentions: participants
            });

        } catch (error) {
            log.error('Error in GHOSTTAG command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du signal Ghost-Tag.' });
        }
    }
};
