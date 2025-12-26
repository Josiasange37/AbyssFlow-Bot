module.exports = {
    name: 'privacy',
    aliases: ['privacypolicy'],
    description: 'Privacy policy of the bot',
    async execute({ chatId, bot }) {
        const text = [
            `*🛡️ Politique de Confidentialité*`,
            ``,
            `1. On garde pas tes messages sur serveur.`,
            `2. Tes données restent sur ton WhatsApp.`,
            `3. Le bot process tes commandes localement.`,
            ``,
            `Check le code si t'as un doute:`,
            `https://github.com/Josiasange37/AbyssFlow-Bot`
        ].join('\n');
        await bot.sendSafeMessage(chatId, text);
    }
};
