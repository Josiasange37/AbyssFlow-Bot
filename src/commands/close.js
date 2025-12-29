module.exports = {
  name: 'close',
  aliases: ['lock'],
  description: 'Close group for admins only',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot }) {
    try {
      await sock.groupSettingUpdate(chatId, 'announcement');
      await bot.sendMessage(chatId, {
        text: `🔒 Silence radio.\nSeuls les admins peuvent parler.`,
        quoted: message
      });
    } catch (error) {
      await bot.sendSafeMessage(chatId, `impossible de fermer le groupe :/ vérifie mes droits.`);
    }
  }
};
