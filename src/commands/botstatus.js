module.exports = {
  name: 'botstatus',
  aliases: ['botinfo'],
  description: 'Show bot status in the current group',
  isGroupOnly: true,
  async execute({ sock, chatId, bot }) {
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botParticipant = groupMetadata.participants.find(p => p.id === botId);

      const totalMembers = groupMetadata.participants.length;
      const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
      const isAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

      const statusMsg = [
        `* \`${bot.botName || 'Diane'}\` *`,
        ``,
        `*État d'Accréditation*`,
        `Localisation : \`${groupMetadata.subject}\``,
        `Membres détectés : \`${totalMembers}\``,
        `Autorités (Admins) : \`${admins.length}\``,
        ``,
        isAdmin ? `\`ACCRÉDITATION: ADMIN ✅\`` : `\`ACCRÉDITATION: LIMITÉE ❌\``,
        ``,
        isAdmin ? `Interface de gestion opérationnelle.` : `Droit d'administration requis pour les fonctions avancées.`
      ].join('\n');

      await bot.sendSafeMessage(chatId, statusMsg);

    } catch (error) {
      await bot.sendSafeMessage(chatId, `galère pour avoir le status: ${error.message}`);
    }
  }
};
