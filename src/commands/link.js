module.exports = {
  name: 'link',
  aliases: ['invitelink', 'grouplink'],
  description: 'Get the group invite link',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ chatId, bot, message }) {
    try {
      const code = await bot.sock.groupInviteCode(chatId);
      const link = `https://chat.whatsapp.com/${code}`;
      await bot.sendMessage(chatId, { text: `🔗 *Lien du groupe :*\n${link}` }, { quoted: message });
    } catch (error) {
      console.error('Link error:', error);
      await bot.sendMessage(chatId, { text: "J'arrive pas à choper le lien. Je suis bien admin ? 🛡️" }, { quoted: message });
    }
  }
};
