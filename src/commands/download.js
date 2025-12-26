module.exports = {
    name: 'download',
    aliases: ['dl', 'db'],
    description: 'Download media from links (Placeholder/Lightweight)',
    async execute({ chatId, args, bot }) {
        const url = args[0];
        if (!url) return await bot.sendSafeMessage(chatId, 'mets un lien bg');

        await bot.sendSafeMessage(chatId, `⚙️ Je vais voir ce que je peux faire pour ce lien...\n(Note: Version ultra légère, ça marche pas sur tout !)`);

        await bot.sendSafeMessage(chatId, `Désolé bg, sur cette version gratuite je peux pas encore télécharger des fichiers lourds. 📉`);
    }
};
