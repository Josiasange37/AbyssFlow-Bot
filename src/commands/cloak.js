const { log } = require('../utils/logger');

module.exports = {
    name: 'cloak',
    description: '👻 Global Stealth Toggle: Makes the bot\'s actions invisible (No typing/online status).',
    category: 'admin',
    isAdmin: true,
    async execute({ sock, chatId, bot }) {
        try {
            bot.cloakMode = !bot.cloakMode;

            const status = bot.cloakMode ? 'ACTIVÉ 🟢' : 'DÉSACTIVÉ 🔴';
            const message = bot.cloakMode
                ? '👻 *CLOAK MODE ACTIVÉ* \nLe bot est désormais en mode furtif total. Aucune présence (typing/online) ne sera affichée.'
                : '👁️ *CLOAK MODE DÉSACTIVÉ* \nLe bot est de nouveau visible lors de ses interactions.';

            await sock.sendMessage(chatId, { text: message });
            log.info(`Cloak mode toggled: ${bot.cloakMode}`);

        } catch (error) {
            log.error('Error in CLOAK command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du basculement du mode furtif.' });
        }
    }
};
