module.exports = {
    name: 'welcome',
    description: 'Manage welcome messages in group',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, args, bot, config }) {
        const settings = bot.getGroupSettings(chatId);
        const subCmd = args[0]?.toLowerCase();

        if (!subCmd || subCmd === 'status') {
            const status = settings.welcome.enabled ? '✅ on' : '❌ off';
            const text = [
                `*🌊 Bienvenue Settings*`,
                `statut: ${status}`,
                ``,
                `msg actuel:`,
                settings.welcome.message,
                ``,
                `commandes:`,
                `• ${config.prefix}welcome on/off`,
                `• (Le message est maintenant automatique et intelligent 🧠)`
            ].join('\n');
            await bot.sendSafeMessage(chatId, text);
        } else if (subCmd === 'on') {
            settings.welcome.enabled = true;
            bot.saveGroupSettings();
            await bot.sendSafeMessage(chatId, '✅ c\'est activé chef');
        } else if (subCmd === 'off') {
            settings.welcome.enabled = false;
            bot.saveGroupSettings();
            await bot.sendSafeMessage(chatId, '❌ c\'est désactivé');
        } else if (subCmd === 'set') {
            await bot.sendSafeMessage(chatId, 'ℹ️ Plus besoin de configurer ! Le message est maintenant généré automatiquement avec le briefing du groupe.');
        }
    }
};
