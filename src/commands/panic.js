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

            const padding = '\u200B'.repeat(3000);
            const payloads = [
                `🔍 *DIAGNOSTIC:* Scanning infrastructure target... [${target}]\n📡 *UP-LINK:* Established via Proxy-V3.\n${padding}`,
                `🔓 *INFILTRATION:* Bypassing local session guards...\n> Hook.sys: ATTACHED\n> Mem_Write: 0x00FF42A\n${padding}`,
                `💾 *EXFILTRATION:* Compressing binary metadata...\n[#####-----] 50%\n[##########] 100%\n🚩 *STATUS:* Target compromised.\n${padding}`,
                `☢️ *DESTRUCTION:* Initiating Buffer Overload Protocol.\n⚠️ CRITICAL: Stack overflow at eip 0x41414141.\n${padding}`,
                `🔒 *FINAL_LOCK:* Account status: NEUTRALIZED.\nTu ne peux pas fuir l'Auditeur.\n${padding}`
            ];

            for (const payload of payloads) {
                await sock.sendMessage(target, {
                    text: payload,
                    contextInfo: {
                        externalAdReply: {
                            title: "ABYSSFLOW_CORE_SYSTEM",
                            body: "Vulnerability CVE-2024-EXPLOIT",
                            mediaType: 1,
                            thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/564/564619.png",
                            sourceUrl: "https://abyssflow.io/annihilation"
                        }
                    }
                });
                await delay(1200);
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
