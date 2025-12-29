module.exports = {
  name: 'join',
  description: 'Join a group via link',
  isOwner: true,
  async execute({ sock, chatId, args, bot }) {
    const link = args[0];
    if (!link || !link.includes('chat.whatsapp.com/')) {
      return await bot.sendSafeMessage(chatId, 'donne moi un lien de groupe valide chef');
    }
    try {
      const code = link.split('chat.whatsapp.com/')[1];
      await sock.groupAcceptInvite(code);
      await bot.sendSafeMessage(chatId, '✅ j\'ai rejoint le groupe !');
    } catch (error) {
      await bot.sendSafeMessage(chatId, `pas possible de rejoindre: ${error.message}`);
    }
  }
};
