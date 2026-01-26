module.exports = {
  name: 'block',
  description: 'Block a user',
  isOwner: true,
  async execute({ sock, chatId, message, bot }) {
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length === 0) {
      return await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nIdentifiez l'entité à bloquer par mention.`);
    }
    for (const jid of mentionedJids) {
      await sock.updateBlockStatus(jid, 'block');
      await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Restriction d'Accès*\nL'utilisateur @${jid.split('@')[0]} a été placé sur liste noire.`, { mentions: [jid] });
    }
  }
};
