module.exports = {
  name: 'unblock',
  description: 'Unblock a user',
  isOwner: true,
  async execute({ sock, chatId, message, bot }) {
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length === 0) {
      return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nSpécifiez l'entité à rétablir.` });
    }
    for (const jid of mentionedJids) {
      await sock.updateBlockStatus(jid, 'unblock');
      await bot.sendMessage(chatId, {
        text: `* \`${bot.botName || 'Diane'}\` *\n\n*Rétablissement d'Accès*\nL'utilisateur @${jid.split('@')[0]} a été retiré de la liste noire.`,
        mentions: [jid]
      });
    }
  }
};
