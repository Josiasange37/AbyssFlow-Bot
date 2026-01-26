module.exports = {
  name: 'about',
  description: 'En savoir plus sur moi',
  category: 'core',
  async execute({ chatId, message, bot, config }) {
    const { name } = config.creator;
    const uptime = bot.formatDuration(Date.now() - bot.metrics.startedAt);

    const aboutText = [
      `Salut ! Je suis Diane, ton assistante de groupe 💙`,
      `Je t'aide à gérer et organiser ton groupe WhatsApp.`,
      ``,
      `En ligne depuis ${uptime} ⏱️`,
      `Créée par ${name} 👨‍💻`
    ].join('\n');

    await bot.sendSafeMessage(chatId, aboutText, { quotedMessage: message });
  }
};
