module.exports = {
  name: 'unmute',
  description: 'Unmute a user in the group',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ chatId, message, bot }) {
    try {
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        message.message?.extendedTextMessage?.contextInfo?.participant;

      if (!mentioned) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez identifier l'utilisateur à libérer.` }, { quoted: message });
      }

      if (bot.mutedUsers && bot.mutedUsers.has(chatId) && bot.mutedUsers.get(chatId).has(mentioned)) {
        bot.mutedUsers.get(chatId).delete(mentioned);
        await bot.sendMessage(chatId, {
          text: `* \`${bot.botName || 'Diane'}\` *\n\n*Fin de Sanction*\nLa liberté d'expression de @${mentioned.split('@')[0]} a été rétablie.`,
          mentions: [mentioned]
        });
      } else {
        await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Notification*\nCette entité n'est pas sous le coup d'une suspension.` });
      }

    } catch (error) {
      console.error('Unmute error:', error);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de la levée de suspension.` }, { quoted: message });
    }
  }
};
