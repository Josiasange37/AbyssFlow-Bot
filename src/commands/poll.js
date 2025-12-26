module.exports = {
    name: 'poll',
    description: 'Create a poll in the group',
    isGroupOnly: true,
    async execute({ chatId, args, bot, message }) {
        try {
            const input = args.join(' ');
            if (!input.includes('|')) {
                return await bot.sendMessage(chatId, {
                    text: "Usage: *poll Question | Choix 1 | Choix 2 | ...\n\nEx: *poll Qui est le plus fort ? | Psycho | Bo"
                }, { quoted: message });
            }

            const parts = input.split('|').map(p => p.trim()).filter(Boolean);
            const question = parts[0];
            const options = parts.slice(1);

            if (options.length < 2) {
                return await bot.sendMessage(chatId, { text: "Il faut au moins 2 options mola ! 🗳️" }, { quoted: message });
            }

            await bot.sock.sendMessage(chatId, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            });

        } catch (error) {
            console.error('Poll error:', error);
            await bot.sendMessage(chatId, { text: "Erreur lors de la création du sondage... 🛠️" }, { quoted: message });
        }
    }
};
