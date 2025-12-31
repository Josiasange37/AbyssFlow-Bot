const { log } = require('../utils/logger');

module.exports = {
    name: 'blackout',
    description: '🌑 Media Blackout: Instantly deletes any image, video, or audio sent by the target.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            if (!bot.blackoutList) bot.blackoutList = new Set();

            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            if (bot.blackoutList.has(target)) {
                bot.blackoutList.delete(target);
                await sock.sendMessage(chatId, { text: `🛡️ *BLACKOUT DÉSACTIVÉ:* @${target.split('@')[0]} peut à nouveau envoyer des médias.`, mentions: [target] });
            } else {
                bot.blackoutList.add(target);
                await sock.sendMessage(chatId, {
                    text: `🌑 *BLACKOUT ACTIVÉ:* @${target.split('@')[0]} est désormais aveuglé. Tout média envoyé sera neutralisé.`,
                    mentions: [target]
                });
            }

        } catch (error) {
            log.error('Error in BLACKOUT command:', error);
        }
    }
};
