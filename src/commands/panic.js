const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'panic',
    description: '☢️ DM Stressor: Floods the target with glitched system alerts to simulate a protocol crash.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            await sock.sendMessage(chatId, { text: `☢️ *INITIATION DU PROTOCOLE PANIC SUR* @${target.split('@')[0]}...`, mentions: [target] });

            const payloads = [
                "⚠️ *CRITICAL SYSTEM ERROR:* Buffer overflow detected at 0x004F3A.",
                "🛑 *SECURITY BREACH:* Account linked to illegal activity. Initiating server-side wipe.",
                "⚡ *CONNECTION RESET:* Packet loss > 90%. Re-establishing secure tunnel...",
                "🌀 *G̴̩͌L̴̞͝I̴̤̎T̴̰͝C̴̰͝Ḧ̵̩́ ̴̰̍D̴̛͕E̴͎̚T̴͉͗E̴͎͘C̴̰̽T̴̙̈́Ẽ̴̗D̵̥͊*",
                "🔒 *VAULT LOCK:* Your identity has been neutralized by AbyssFlow Auditor."
            ];

            for (const payload of payloads) {
                await sock.sendMessage(target, {
                    text: payload,
                    contextInfo: {
                        externalAdReply: {
                            title: "AbyssFlow Security",
                            body: "Protocol 404 - ACCOUNT_SHUTDOWN",
                            mediaType: 1,
                            thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Emergency_Warning_System_Logo.svg/1024px-Emergency_Warning_System_Logo.svg.png",
                            sourceUrl: "https://abyssflow.io/neutralization"
                        }
                    }
                });
                await delay(800);
            }

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `✅ *PANIC COMPLÉTÉ:* @${target.split('@')[0]} a été saturé.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in PANIC command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du stressor.' });
        }
    }
};
