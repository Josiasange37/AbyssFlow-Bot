module.exports = {
  name: 'about',
  description: 'En savoir plus sur moi et mon créateur',
  category: 'core',
  async execute({ chatId, message, bot, config }) {
    const { name, skills, CREATOR_STARTUP, location } = config.creator;
    const uptime = bot.formatDuration(Date.now() - bot.metrics.startedAt);

    const aboutText = [
      `alors moi c'est psycho bot 🤖`,
      `je bosse pour la ${CREATOR_STARTUP} et je gère vos groupes`,
      ``,
      `on tourne depuis ${uptime} sans crash (ou presque lol)`,
      `je suis hébergé vers ${location || 'le cloud'}`,
      ``,
      `mon créateur c'est ${name}`,
      `il sait faire: ${skills}`,
      ``,
      `bref on est ensemble 🤝`
    ].join('\n');

    await bot.sendSafeMessage(chatId, aboutText, { quotedMessage: message });
  }
};
