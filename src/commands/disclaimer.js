module.exports = {
  name: 'disclaimer',
  aliases: ['legal'],
  description: 'Bot legal disclaimer',
  async execute({ chatId, bot }) {
    const text = [
      `* \`${bot.botName || 'Diane'}\` *`,
      ``,
      `*CLAUSE DE NON-RESPONSABILITÉ*`,
      ``,
      `• Entité : Diane opère en tant qu'assistante exécutive indépendante.`,
      `• Responsabilité : L'utilisateur final assume l'entière responsabilité des interactions effectuées.`,
      `• Conformité : Veillez à respecter les conditions générales du fournisseur de service tiers.`,
      ``,
      `Système opérationnel sous licence standard.`
    ].join('\n');
    await bot.sendMessage(chatId, { text });
  }
};
