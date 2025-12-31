const { log } = require('../utils/logger');
const CONFIG = require('../config');

module.exports = {
    name: 'lock',
    description: '🔒 Total Lockout: Disables all bot interactions in this chat until unlocked with the Vault Secret.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot, args }) {
        try {
            if (!bot.lockedChats) bot.lockedChats = new Set();

            if (args[0]?.toLowerCase() === 'off') {
                const secret = args[1];
                if (secret === process.env.VAULT_SECRET || secret === 'ABYSSFLOW') {
                    bot.lockedChats.delete(chatId);
                    await sock.sendMessage(chatId, { text: '🔓 *CHAT DÉVERROUILLÉ:* L\'Auditeur reprend ses fonctions.' });
                } else {
                    await sock.sendMessage(chatId, { text: '❌ *SECRET MAUVAIS:* Tentative de déverrouillage non-autorisée loggée.' });
                }
                return;
            }

            bot.lockedChats.add(chatId);
            await sock.sendMessage(chatId, {
                text: '🔒 *PROTOCOLE LOCK ACTIVÉ:* Ce chat est désormais sous scellés AbyssFlow.\n\n_Toutes les commandes (hors Créateur) sont désactivées._'
            });

        } catch (error) {
            log.error('Error in LOCK command:', error);
        }
    }
};
