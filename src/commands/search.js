const axios = require('axios');

module.exports = {
    name: 'search',
    aliases: ['google', 'find'],
    description: 'Search Google (simulated lightweight)',
    async execute({ chatId, args, bot }) {
        const query = args.join(' ');
        if (!query) return await bot.sendSafeMessage(chatId, 'qu\'est-ce que tu cherches bg ?');

        try {
            await bot.sendSafeMessage(chatId, `🔍 Je regarde ça pour toi...`);

            const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const text = [
                `j'ai jeté un oeil pour "${query}" 👀`,
                ``,
                `franchement y'a plein de trucs, tiens le lien direct:`,
                `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                ``,
                `cherche un peu par toi même aussi lol 🤝`
            ].join('\n');

            await bot.sendSafeMessage(chatId, text);
        } catch (error) {
            await bot.sendSafeMessage(chatId, `oops google est têtu aujourd'hui.`);
        }
    }
};
