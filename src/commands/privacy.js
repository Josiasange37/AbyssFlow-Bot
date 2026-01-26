module.exports = {
  name: 'privacy',
  aliases: ['privacypolicy'],
  description: 'Privacy policy of the bot',
  async execute({ chatId, bot }) {
    const text = [
      `* \`${bot.botName || 'Diane'}\` *`,
      ``,
      `*POLITIQUE DE PROTECTION DES DONNÉES*`,
      ``,
      `• Stockage : Aucune archive de communication n'est conservée sur nos serveurs.`,
      `• Localisation : Le traitement des données est opéré dans l'environnement local du terminal.`,
      `• Transparence : L'architecture du système est consultable en libre accès.`,
      ``,
      `Référence technique :`,
      `https://github.com/Josiasange37/AbyssFlow-Bot`
    ].join('\n');
    await bot.sendMessage(chatId, { text });
  }
};
