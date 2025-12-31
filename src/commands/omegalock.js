const { log } = require('../utils/logger');

module.exports = {
    name: 'omegalock',
    description: '🌑 Omega Lock: Disables ALL bot commands across ALL chats for everyone except the Owner.',
    category: 'defensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot }) {
        try {
            bot.globalLock = !bot.globalLock;

            if (bot.globalLock) {
                await sock.sendMessage(chatId, { text: '🌑 *OMEGA-LOCK ACTIVÉ:* L\'Auditeur entre en mode hibernation sélective. Seul le Créateur peut m\'éveiller.' });
            } else {
                await sock.sendMessage(chatId, { text: '🌟 *OMEGA-LOCK RÉVOQUÉ:* Les systèmes sont à nouveau opérationnels pour le Clan.' });
            }

        } catch (error) {
            log.error('Error in OMEGALOCK:', error);
        }
    }
};
