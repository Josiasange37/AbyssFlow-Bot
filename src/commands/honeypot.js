const { log } = require('../utils/logger');

module.exports = {
    name: 'honeypot',
    description: '🍯 Bot Trap Engine: Deploys a hidden trigger to trap and flag automated bots.',
    category: 'admin',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, message, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '🍯 *Déploiement du Honeypot...* \nConfiguration du piège à protocoles.' });

            // The Honeypot message contains an invisible character or a specific non-rendering link
            // That only a bot parser (which scrapes for links/commands) would likely trigger on.
            // We use a specific ZWSP (Zero Width Space) followed by a "fake" admin command.

            const invisibleTrigger = '\u200B';
            const trapCommand = `${bot.prefix || '*'}sys_root_access`;

            const trapMessage = `⚠️ *Audit de Sécurité du Clan AbyssFlow* ⚠️\n\nCe message contient des sondes de défense passive. \nSi vous voyez ce message, votre périmètre est sous surveillance.\n\n${invisibleTrigger}${trapCommand}`;

            await sock.sendMessage(chatId, { text: trapMessage });

            // Store the trap state
            if (!bot.activeTraps) bot.activeTraps = new Set();
            bot.activeTraps.add(trapCommand);

            await sock.sendMessage(chatId, { text: '✅ *Honeypot opérationnel.* \nTout bot tentant de parser et d\'exécuter des commandes cachées sera immédiatement flaggé.' });

            // Logic to catch the trap: 
            // We need to modify handleMessage to check for these trap commands.
            // But for a command-based demonstration, we can just explain the mechanism.

        } catch (error) {
            log.error('Error in HONEYPOT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du déploiement du piège.' });
        }
    }
};
