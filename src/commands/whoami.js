const { normalizeNumber } = require('../utils/helpers');

module.exports = {
  name: 'whoami',
  description: 'Show your account information',
  async execute({ chatId, message, bot, sender, isOwner, isGroup, isGroupAdmin, canUseAdminCommands }) {
    const whoamiMsg = [
      `* \`${bot.botName || 'Diane'}\` *`,
      '',
      `*RAPPORT D'IDENTITÉ OPÉRATIVE*`,
      `Identifiant JID : \`${sender}\``,
      `Référence Normalisée : \`${normalizeNumber(sender)}\``,
      '',
      `*AUTORISATIONS & PRIVILÈGES*`,
      `• Rang de Propriétaire : ${isOwner ? '`AUTORISÉ ✅`' : '`RESTREINT ❌`'}`,
      `• Autorité de Groupe : ${isGroup && isGroupAdmin ? '`ADMIN ✅`' : (isGroup ? '`MEMBRE ❌`' : '`N/A`')}`,
      `• Interface Administrative : ${canUseAdminCommands ? '`ACTIVÉE ✅`' : '`DÉSACTIVÉE ❌`'}`,
      '',
      `Rapport généré pour audit technique.`
    ].join('\n');

    await bot.sendMessage(chatId, { text: whoamiMsg }, { quoted: message });
  }
};
