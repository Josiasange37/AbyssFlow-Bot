module.exports = {
    name: 'goodbye',
    description: 'Manage goodbye messages in group',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, args, bot, config }) {
        const settings = bot.getGroupSettings(chatId);
        const subCmd = args[0]?.toLowerCase();

        if (!subCmd || subCmd === 'status') {
            const status = settings.goodbye.enabled ? '✅ on' : '❌ off';
            const text = [
                `*👋 Au Revoir Settings*`,
                `statut: ${status}`,
                ``,
                `commandes:`,
                `• ${config.prefix}goodbye on/off`,
                `• (Généré automatiquement par le bot 🧠)`
            ].join('\n');
            await bot.sendSafeMessage(chatId, text);
        } else if (subCmd === 'on') {
            settings.goodbye.enabled = true;
            bot.saveGroupSettings();
            await bot.sendSafeMessage(chatId, '✅ au revoir activé bg');
        } else if (subCmd === 'off') {
            settings.goodbye.enabled = false;
            bot.saveGroupSettings();
            await bot.sendSafeMessage(chatId, '❌ au revoir désactivé');
        } else if (subCmd === 'set') {
            await bot.sendSafeMessage(chatId, 'ℹ️ Plus besoin de configurer ! Le bot gère le message tout seul maintenant.');
        }
    }
};
