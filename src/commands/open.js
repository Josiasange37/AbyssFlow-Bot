module.exports = {
  name: 'open',
  aliases: ['unlock'],
  description: 'Open group for everyone',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot }) {
    try {
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      await bot.sendMessage(chatId, {
        text: `🔓 C'est ouvert la mif !\nTout le monde peut parler maintenant.`,
        quoted: message
      });
    } catch (error) {
      await bot.sendSafeMessage(chatId, `j'arrive pas à ouvrir le groupe :/ c'est peut-être réservé aux admins ?`);
    }
  }
};
