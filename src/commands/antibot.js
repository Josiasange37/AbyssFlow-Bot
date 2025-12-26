module.exports = {
    name: 'antibot',
    aliases: ['antibots', 'nobot'],
    description: 'Auto-kick other bots from group',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ chatId, args, bot, config }) {
        const settings = bot.getGroupSettings(chatId);
        const subCmd = args[0]?.toLowerCase();

        if (!subCmd || subCmd === 'status') {
            const status = settings.antibot?.enabled ? '✅ Activé' : '❌ Désactivé';
            await bot.sendSafeMessage(chatId, `🤖 Antibot: ${status}\nPour changer: ${config.prefix}antibot on/off`);
            return;
        }

        if (subCmd === 'on' || subCmd === 'enable' || subCmd === 'activer') {
            settings.antibot.enabled = true;
            bot.saveGroupSettings();
            await bot.sendSafeMessage(chatId, `🤖 Antibot activé. Je vire les autres bots direct.`);
        } else if (subCmd === 'off' || subCmd === 'disable' || subCmd === 'desactiver') {
            settings.antibot.enabled = false;
            bot.saveGroupSettings();
            await bot.sendSafeMessage(chatId, `🤖 Antibot désactivé. Les portes sont ouvertes.`);
        } else {
            await bot.sendSafeMessage(chatId, `commande inconnue. fait ${config.prefix}antibot on ou off`);
        }
    }
};
