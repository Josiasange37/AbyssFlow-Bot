module.exports = {
  name: 'terms',
  aliases: ['tos'],
  description: 'Bot terms of service',
  async execute({ chatId, bot }) {
    const text = [
      `*📜 Conditions d'Utilisation*`,
      ``,
      `- Pas de spam.`,
      `- Pas de trucs illégaux.`,
      `- Sois respectueux.`,
      ``,
      `Si tu spammes, je peux te block direct. 🚫`
    ].join('\n');
    await bot.sendSafeMessage(chatId, text);
  }
};
