const { log } = require('../utils/logger');

module.exports = {
    name: 'phantom',
    description: '👻 Phantom Storm: Saturates the chat with glitched mentions and phantom tags.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants.map(p => p.id);

            const glitchText = "P̸H̴A̸N̸T̸O̸M̴ ̵S̴T̸O̴R̸M̴";
            const separator = "\n".repeat(50);

            const payload = `
${glitchText}
${separator}
👻 *L'OMBRE D'ABYSSFLOW VOUS OBSERVE* 👻
${glitchText}
`.trim();

            await sock.sendMessage(chatId, {
                text: payload,
                mentions: participants,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            });

        } catch (error) {
            log.error('Error in PHANTOM command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du protocole Phantom.' });
        }
    }
};
