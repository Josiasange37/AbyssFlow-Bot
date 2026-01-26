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
        text: `* \`${bot.botName || 'Diane'}\` *\n\n*Verrouillage Périmètre*\nLe canal de communication est désormais restreint aux autorités (Admins).`,
        quoted: message
      });
    } catch (error) {
      await bot.sendSafeMessage(chatId, `impossible de fermer le groupe :/ vérifie mes droits.`);
    }
  }
};
