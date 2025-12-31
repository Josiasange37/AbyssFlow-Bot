const { log } = require('../utils/logger');

module.exports = {
    name: 'override',
    description: '🦾 Admin Enforcement: Automatically demotes any unauthorized admin change.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            if (!bot.overrideGroups) bot.overrideGroups = new Set();

            if (bot.overrideGroups.has(chatId)) {
                bot.overrideGroups.delete(chatId);
                return await sock.sendMessage(chatId, { text: '🦾 *OVERRIDE DÉSACTIVÉ.* \nLa gestion des admins est redevenue normale.' });
            }

            bot.overrideGroups.add(chatId);
            await sock.sendMessage(chatId, {
                text: '🦾 *OVERRIDE ACTIVÉ.* \nLe bot surveille désormais les privilèges. Toute promotion non autorisée sera révoquée instantanément.'
            });

        } catch (error) {
            log.error('Error in OVERRIDE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'activation de l\'Override.' });
        }
    }
};
