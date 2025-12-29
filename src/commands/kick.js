module.exports = {
  name: 'kick',
  aliases: ['remove'],
  description: 'Remove a user from the group',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot, config, sender }) {
    try {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const isOwner = config.owners.includes(sender.replace('@s.whatsapp.net', ''));

      if (mentionedJids.length === 0) {
        await bot.sendSafeMessage(chatId, `Il faut taguer un utilisateur pour le retirer du groupe. Exemple: ${config.prefix}kick @utilisateur`);
        return;
      }

      const isBotAdmin = await bot.isBotGroupAdmin(chatId);

      // FAILSAFE: If not bot admin, only allow owner to see the explicit failure reason
      if (!isBotAdmin) {
        await bot.sendSafeMessage(chatId, `Je ne suis pas administrateur de ce groupe. Je ne peux donc pas retirer de membres. 🤷‍♂️`);
        return;
      }

      for (const targetJid of mentionedJids) {
        // Protect owner/bot from being kicked by themselves (optional safety)
        if (config.owners.includes(targetJid.replace('@s.whatsapp.net', ''))) {
          await bot.sendSafeMessage(chatId, `Je ne peux pas retirer un de mes créateurs. 🛡️`);
          continue;
        }

        await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove');
        await bot.sendSafeMessage(chatId, `L'utilisateur @${targetJid.split('@')[0]} a été retiré du groupe. 👋`, { mentions: [targetJid] });
      }
    } catch (error) {
      log.error('Kick command error:', error.message);
      await bot.sendSafeMessage(chatId, `Action impossible : ${error.message}`);
    }
  }
};
