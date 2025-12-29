module.exports = {
  name: 'kick',
  aliases: ['remove'],
  description: 'Remove a user from the group',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot, config }) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (mentionedJids.length === 0) {
        await bot.sendSafeMessage(chatId, `faut taguer quelqu'un pour le virer. ex: ${config.prefix}kick @relou`);
        return;
      }

      const isBotAdmin = await bot.isBotGroupAdmin(chatId);
      if (!isBotAdmin) {
        await bot.sendSafeMessage(chatId, `je suis pas admin, je peux virer personne 🤷‍♂️`);
        return;
      }

      for (const targetJid of mentionedJids) {
        await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove');
        await bot.sendSafeMessage(chatId, `Allez salut @${targetJid.split('@')[0]} 👋`, { mentions: [targetJid] });
      }
    } catch (error) {
      await bot.sendSafeMessage(chatId, `impossible de le virer: ${error.message}`);
    }
  }
};
