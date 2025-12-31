const { log } = require('../utils/logger');

module.exports = {
    name: 'decryptionleak',
    description: '🔐 Decryption Spoof: Sends a fake metadata dump of the target\'s activity.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const leakText = `
🔐 *ABYSSFLOW DECRYPTION LEAK* 🔐
________________________________

[RAW_E2EE_STREAM_CAPTURED]
> Target: @${target.split('@')[0]}
> Cipher: Signal-Protocol-v3
> Session_ID: AX-7882-BFQ

[METADATA_DUMP]
- Last_Stanza: ${Math.random().toString(36).substring(7).toUpperCase()}
- Latency: 12ms
- Packet_Integrity: COMPROMISED
- Local_Key_Exfiltration: SUCCESS (v2.4)

[PREVIEW_DECRYPTED]
"L'Auditeur a accès au flux de données brut. La vie privée est une illusion dans l'Abysses."

⚠️ *Status:* Le chiffrement de bout en bout a été contourné via une injection de métadonnées.
________________________________
`.trim();

            await sock.sendMessage(target, {
                text: leakText,
                mentions: [target],
                contextInfo: {
                    externalAdReply: {
                        title: "CRITICAL: E2EE Bypass Detection",
                        body: "Raw Data Stream Exposed",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/4315/4315570.png",
                        sourceUrl: "https://abyssflow.io/decryption"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `🔐 *DECRYPTION LEAK DÉPLOYÉ* sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in DECRYPTIONLEAK command:', error);
        }
    }
};
