module.exports = {
  name: 'hidetag',
  aliases: ['htag', 'tag'],
  description: 'Mention all group members invisibly',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ chatId, args, bot, message }) {
    try {
      const metadata = await bot.sock.groupMetadata(chatId);
      const participants = metadata.participants;
      const mentions = participants.map(p => p.id);

      const text = args.join(' ') || "Annonce Psycho Bo 📢";

      await bot.sendMessage(chatId, {
        text: text,
        mentions: mentions
      });

    } catch (error) {
      console.error('Hidetag error:', error);
      await bot.sendMessage(chatId, { text: "Erreur lors du hidetag ... 🛠️" }, { quoted: message });
    }
  }
};
