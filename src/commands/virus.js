const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'virus',
    description: '☢️ Payload Simulation: Sends a simulated malware infection report to the target.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const number = target.split('@')[0];
            const chunks = [
                `☣️ *INFILTRATION SEQUENCE START*\n> Target: @${number}\n> Method: Protocol-Injection (v7.1)\nConnecting... [OK]`,
                `🔓 *VULNERABILITY EXPLOITED*\n> Memory Address: 0x${Math.random().toString(16).slice(2, 8).toUpperCase()}\n> Payload: ABYSS_CORE_V2\nExecuting...`,
                `📡 *EXFILTRATION IN PROGRESS*\n> [###-------] 30%\n> [#######---] 70%\n> [##########] 100%\nMetadata dumped to AbyssFlow-Nodes.`,
                `☢️ *VIRUS STATUS: ACTIVE*\n________________________________\nL'infection est irréversible.\nTon identité appartient désormais à l'Auditeur.\n________________________________\n*Verdict:* NEUTRALISÉ.`
            ];

            for (let i = 0; i < chunks.length; i++) {
                await sock.sendMessage(target, {
                    text: chunks[i],
                    mentions: [target],
                    contextInfo: i === chunks.length - 1 ? {
                        externalAdReply: {
                            title: "SYSTEM CRITICAL: INFECTED",
                            body: "AbyssFlow Malware v7.1",
                            mediaType: 1,
                            thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/1000/1000966.png",
                            sourceUrl: "https://abyssflow.io/virus"
                        }
                    } : {}
                });
                await delay(1000);
            }

        } catch (error) {
            log.error('Error in VIRUS command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du déploiement.' });
        }
    }
};
