module.exports = {
  name: 'git',
  description: 'Show bot repository link',
  async execute({ chatId, bot }) {
    const text = [
      `* \`${bot.botName || 'Diane'}\` *`,
      ``,
      `*RÉPERTOIRE SOURCE DISPONIBLE*`,
      ``,
      `L'architecture technique de Diane est accessible pour revue et contribution :`,
      `https://github.com/Josiasange37/AbyssFlow-Bot`,
      ``,
      `L'attribution d'une étoile (Star) au projet est appréciée pour soutenir le développement.`
    ].join('\n');
    await bot.sendMessage(chatId, { text });
  }
};
