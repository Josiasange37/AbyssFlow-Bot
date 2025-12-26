module.exports = {
    name: 'git',
    description: 'Show bot repository link',
    async execute({ chatId, bot }) {
        const text = [
            `*📂 Psycho Bot Repo*`,
            ``,
            `Envie d'un bot comme moi? Check le repobg:`,
            `https://github.com/Josiasange37/AbyssFlow-Bot`,
            ``,
            `N'oublie pas le ⭐ si tu kiffes!`
        ].join('\n');
        await bot.sendSafeMessage(chatId, text);
    }
};
