module.exports = {
  name: 'terms',
  aliases: ['tos'],
  description: 'Bot terms of service',
  async execute({ chatId, bot }) {
    const text = [
      `* \`${bot.botName || 'Diane'}\` *`,
      ``,
      `*PROTOCOLE D' UTILISATION ET CONDITIONS*`,
      ``,
      `1. L'utilisation à des fins de saturation (spam) est proscrite.`,
      `2. Toute activité illégale via cette interface est strictement interdite.`,
      `3. Le respect du code de conduite inter-unités est impératif.`,
      ``,
      `Le non-respect de ces protocoles entraînera une révocation immédiate des droits d'accès.`
    ].join('\n');
    await bot.sendMessage(chatId, { text });
  }
};
