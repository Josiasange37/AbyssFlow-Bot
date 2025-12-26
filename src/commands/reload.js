const { log } = require('../utils/logger');

module.exports = {
    name: 'reload',
    aliases: ['refresh'],
    category: 'owner',
    description: 'Recharge tous les plugins de commandes à chaud sans redémarrer le bot.',
    usage: 'reload',
    async execute(sock, chatId, message, args, { bot, isOwner }) {
        if (!isOwner) {
            return bot.sendMessage(chatId, { text: "Wesh bg, tu n'as pas les droits pour recharger mes circuits. Seuls mes créateurs peuvent faire ça. 🌑⚡" }, { quoted: message });
        }

        try {
            await bot.loadCommands();
            const count = bot.commands.size;
            await bot.sendMessage(chatId, { text: `🚀 **Système Rechargé !**\n\n${count} commandes sont maintenant en ligne. Le Xyber Clan est à jour. 💻⚡` }, { quoted: message });
            log.info(`Hot-reload triggered by owner in ${chatId}`);
        } catch (error) {
            log.error('Failed to reload commands:', error.message);
            await bot.sendMessage(chatId, { text: "❌ Erreur critique lors du rechargement des circuits. Check la console." }, { quoted: message });
        }
    }
};
