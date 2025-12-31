const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'mimicry',
    description: '🎭 Identity Spoof: Mimics the target\'s name to send a psychological message.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            // Get target profile name
            const contact = await sock.onWhatsApp(target);
            const targetName = contact[0]?.notify || target.split('@')[0];

            await sock.sendMessage(chatId, { text: `🎭 *INITIATION DE LA MIMÉTIQUE:* Acquisition de l'identité @${targetName}...`, mentions: [target] });

            // Store current name (Mock storing, usually in config or memory)
            const oldName = bot.name || "AbyssFlow Auditor";

            // Update Name
            await sock.updateProfileName(targetName);
            await delay(2000);

            // Send payload
            await sock.sendMessage(chatId, {
                text: `👁️ *J'AI PRIS TON VISAGE, @${target.split('@')[0]}.* Tes secrets appartiennent désormais au Clan AbyssFlow.`,
                mentions: [target]
            });

            await delay(5000);

            // Restore Name
            await sock.updateProfileName(oldName);
            await sock.sendMessage(chatId, { text: '🎭 *PROTOCOLE TERMINÉ:* Identité originale restaurée.' });

        } catch (error) {
            log.error('Error in MIMICRY command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la mimétique.' });
        }
    }
};
