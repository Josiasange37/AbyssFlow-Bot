module.exports = {
  name: 'disclaimer',
  aliases: ['legal'],
  description: 'Bot legal disclaimer',
  async execute({ chatId, bot }) {
    const text = [
      `*⚖️ Clause de Non-Responsabilité*`,
      ``,
      `Je suis un bot indépendant.`,
      `Je ne suis pas responsable de ce que tu fais avec.`,
      `Utilise moi sagement pour pas te faire bannir!`,
      ``,
      `🌊 _Water Hashira_`
    ].join('\n');
    await bot.sendSafeMessage(chatId, text);
  }
};
