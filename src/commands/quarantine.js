const { log } = require('../utils/logger');

module.exports = {
    name: 'quarantine',
    description: '🛡️ DM Anti-Scam Shield: Automatically blocks suspicious interactions in private messages.',
    category: 'admin',
    isAdmin: true,
    async execute({ sock, chatId, bot }) {
        try {
            bot.dmShield = !bot.dmShield;

            const status = bot.dmShield ? 'ACTIVÉ 🟢' : 'DÉSACTIVÉ 🔴';
            const message = bot.dmShield
                ? '🛡️ *QUARANTINE PROTOCOL ACTIVÉ* \nLe bot surveille désormais vos MPs. Tout utilisateur envoyant des liens suspects sera instantanément bloqué.'
                : '👁️ *QUARANTINE PROTOCOL DÉSACTIVÉ* \nLe bot ne filtrera plus les interactions en privé.';

            await sock.sendMessage(chatId, { text: message });
            log.info(`DM Shield toggled: ${bot.dmShield}`);

        } catch (error) {
            log.error('Error in QUARANTINE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du basculement du bouclier MP.' });
        }
    }
};
