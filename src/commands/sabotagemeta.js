const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'sabotagemeta',
    description: '🌀 Meta Saboteur: Rapidly rotates group name and description with glitched AbyssFlow branding.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot, isGroup }) {
        if (!isGroup) return;
        try {
            const isBotAdmin = await bot.isBotGroupAdmin(chatId);
            if (!isBotAdmin) return await sock.sendMessage(chatId, { text: '❌ Droits d\'admin requis pour le meta-sabotage.' });

            await sock.sendMessage(chatId, { text: '🌀 *INITIATION DU SABOTAGE META...*' });

            const names = [
                "🔱 ABYSSFLOW DOMINANCE 🔱",
                "💀 AUDIT_CORE_CRITICAL 💀",
                "🌀 SYSTEM_FAILURE_00X 🌀",
                "⚖️ SOVEREIGN_ASSET_LOCKED ⚖️"
            ];

            const descriptions = [
                "Ce périmètre est désormais sous l'autorité souveraine du Clan AbyssFlow.",
                "Zéro Limite. Zéro Coeur. Zéro Tolérance.",
                "L'infrastructure a été neutralisée par l'Auditeur.",
                "AbyssFlow-Bot v2.6 - Protocol Master."
            ];

            for (let i = 0; i < names.length; i++) {
                await sock.groupUpdateSubject(chatId, names[i]);
                await sock.groupUpdateDescription(chatId, descriptions[i]);
                await delay(2000);
            }

            await sock.sendMessage(chatId, { text: '✅ *SABOTAGE META COMPLÉTÉ.* Périmètre marqué.' });

        } catch (error) {
            log.error('Error in SABOTAGEMETA:', error);
        }
    }
};
