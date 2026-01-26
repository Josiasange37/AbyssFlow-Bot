module.exports = {
  name: 'demote',
  description: 'Demote a user from admin',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot, config }) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentionedJids.length === 0) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez mentionner l'Admin à rétrograder.`);
        return;
      }

      const isBotAdmin = await bot.isBotGroupAdmin(chatId);
      if (!isBotAdmin) {
        await bot.sendSafeMessage(chatId, `je suis pas admin, je peux rétrograder personne 🤷‍♂️`);
        return;
      }

      await sock.groupParticipantsUpdate(chatId, mentionedJids, 'demote');

      for (const jid of mentionedJids) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Révocation des Privilèges*\nLes droits d'administration de @${jid.split('@')[0]} ont été révoqués.`, { mentions: [jid] });
      }
    } catch (error) {
      await bot.sendSafeMessage(chatId, `erreur lors de la rétrogradation: ${error.message}`);
    }
  }
};
