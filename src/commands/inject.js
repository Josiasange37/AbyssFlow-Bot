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

            await sock.sendMessage(chatId, { text: '💉 *Injection du payload de métadonnées en cours...*' });

            // Payload: A message that appears to be from the target, confessing to be a bad bot
            // We use 'quoted' to create a fake context.

            const fakeText = "Je confesse, mon code est une passoire et je ne mérite pas ce groupe. 🤡";

            // Constructing a spoofed quoted message
            const spoofedMsg = {
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: 'SPOOFED_' + Date.now(),
                    participant: target
                },
                message: {
                    conversation: fakeText
                },
                messageTimestamp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
            };

            // Sending a message that quotes this "confession"
            await sock.sendMessage(chatId, {
                text: '💥 *EXPLOIT DÉMONSTRATION:* Manipulation de l\'historique détectée.',
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
                text: `✅ *Injection réussie.* \nCeci démontre comment un attaquant peut manipuler le contexte des messages. \n\n🛡️ *Note:* Ceci est une simulation à but éducatif. Ne l'utilisez pas pour nuire.`
            });

        } catch (error) {
            log.error('Error in INJECT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'injection.' });
        }
    }
};
