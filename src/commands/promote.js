module.exports = {
  name: 'promote',
  description: 'Promote a user to admin',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot, config }) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentionedJids.length === 0) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez mentionner un utilisateur : \`${config.prefix}promote @utilisateur\`.`);
        return;
      }

      const isBotAdmin = await bot.isBotGroupAdmin(chatId);
      if (!isBotAdmin) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Restriction*\nAccréditation insuffisante. Veuillez me promouvoir Admin.`);
        return;
      }

      await sock.groupParticipantsUpdate(chatId, mentionedJids, 'promote');

      for (const jid of mentionedJids) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Mise à Jour Privilèges*\nL'utilisateur @${jid.split('@')[0]} a été élevé au rang d'Admin.`, { mentions: [jid] });
      }
    } catch (error) {
      await bot.sendSafeMessage(chatId, `ça a planté désolé: ${error.message}`);
    }
  }
};
