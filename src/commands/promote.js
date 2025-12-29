module.exports = {
  name: 'promote',
  description: 'Promote a user to admin',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot, config }) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentionedJids.length === 0) {
        await bot.sendSafeMessage(chatId, `faut taguer qui tu veux promouvoir chef. ex: ${config.prefix}promote @user`);
        return;
      }

      const isBotAdmin = await bot.isBotGroupAdmin(chatId);
      if (!isBotAdmin) {
        await bot.sendSafeMessage(chatId, `je suis pas admin, je peux promouvoir personne 🤷‍♂️`);
        return;
      }

      await sock.groupParticipantsUpdate(chatId, mentionedJids, 'promote');

      for (const jid of mentionedJids) {
        await bot.sendSafeMessage(chatId, `Allez hop, t'es admin @${jid.split('@')[0]} 😎`, { mentions: [jid] });
      }
    } catch (error) {
      await bot.sendSafeMessage(chatId, `ça a planté désolé: ${error.message}`);
    }
  }
};
