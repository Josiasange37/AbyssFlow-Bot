const axios = require('axios');

module.exports = {
  name: 'search',
  aliases: ['google', 'find'],
  description: 'Search Google (simulated lightweight)',
  async execute({ chatId, args, bot }) {
    const query = args.join(' ');
    if (!query) return await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nRequête de recherche vide.`);

    try {
      await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Recherche Indexée*\nAnalyse des serveurs de recherche en cours...`);

      const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const text = [
        `* \`${bot.botName || 'Diane'}\` *`,
        ``,
        `*Indexation terminées pour :* \`${query}\``,
        ``,
        `Veuillez consulter le portail de données direct :`,
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        ``,
        `Recherche complémentaire recommandée via le lien fourni.`
      ].join('\n');

      await bot.sendSafeMessage(chatId, text);
    } catch (error) {
      await bot.sendSafeMessage(chatId, `oops google est têtu aujourd'hui.`);
    }
  }
};
