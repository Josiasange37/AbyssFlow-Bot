const { log } = require('../utils/logger');
const { generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'inject',
    description: '💉 Metadata Injection Payload: Demonstrates message spoofing and protocol exploitation.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, args, sender }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* Mentionne quelqu\'un ou cite son message pour injecter le payload.' });
            }

            await sock.sendMessage(chatId, { text: '💉 *INITIATING METADATA_CORRUPTION_INJECTION*...\n📡 *PROTOCOL:* Spf-V4 (Injection_Stream_Active)' });

            const fakeText = `[SYS_LOG]: Root architecture compromised. Node: @${target.split('@')[0]} is now under Sovereign oversight. ☣️`;

            // Constructing a spoofed quoted message
            const spoofedMsg = {
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: 'INJ_' + Date.now().toString(36).toUpperCase(),
                    participant: target
                },
                message: {
                    conversation: fakeText
                },
                messageTimestamp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
            };

            // Sending a message that quotes this "confession" (now a system log)
            await sock.sendMessage(chatId, {
                text: '💥 *METADATA_INJECTION_SUCCESS* \n________________________________\n> Vulnerability: Header_Manipulation_v9\n> Result: History_Buffer_Compromised',
                contextInfo: {
                    quotedMessage: spoofedMsg.message,
                    participant: target,
                    remoteJid: chatId,
                    // Additional "Attack" Metadata: High Forwarded count
                    forwardingScore: 999,
                    isForwarded: true
                }
            });

            await sock.sendMessage(chatId, {
                text: `✅ *INJECTION_NODE_ACTIVE.* \nProtocol supremacy confirmed for sector ${chatId.split('@')[0]}.`
            });

        } catch (error) {
            log.error('Error in INJECT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'injection.' });
        }
    }
};
