module.exports = {
  name: 'about',
  description: 'En savoir plus sur moi',
  category: 'core',
  async execute({ chatId, message, bot, config }) {
    const { name } = config.creator;
    const uptime = bot.formatDuration(Date.now() - bot.metrics.startedAt);

    const aboutText = [
      `* \`${config.botName || 'Diane'}\` *`,
      ``,
      `*Assistance Exécutive*`,
      `Solution de gestion et d'optimisation pour groupes professionnels.`,
      ``,
      `• Statut : \`Opérationnel\``,
      `• Disponibilité : \`${uptime}\``,
      `• Conception : \`${name}\``
    ].join('\n');

    await bot.sendSafeMessage(chatId, aboutText, { quotedMessage: message });
  }
};
