const Warning = require('../database/models/Warning');

module.exports = {
  name: 'warns',
  aliases: ['warnings'],
  description: 'Check your warnings or those of another member',
  isGroupOnly: true,
  async execute({ chatId, args, bot, message, sender }) {
    try {
      const target = message.message?.extendedTextMessage?.contextInfo?.participant || sender;
      const stats = await Warning.findOne({ userId: target, groupId: chatId });

      const userTag = `@${target.split('@')[0]}`;

      if (!stats || stats.warnings === 0) {
        return await bot.sendMessage(chatId, {
          text: `✅ ${userTag} n'a aucun avertissement. Propre !`,
          mentions: [target]
        }, { quoted: message });
      }

      let text = `🚩 *DOSSIER DISCIPLINAIRE* 🚩\n\n`;
      text += `👤 *Utilisateur:* ${userTag}\n`;
      text += `🔴 *Total:* ${stats.warnings}/3\n\n`;
      text += `📄 *Historique:* \n`;

      stats.reasons.forEach((r, i) => {
        text += `${i + 1}. ${r.text} (${new Date(r.date).toLocaleDateString()})\n`;
      });

      await bot.sendMessage(chatId, {
        text,
        mentions: [target]
      }, { quoted: message });

    } catch (error) {
      console.error('Warns command error:', error);
      await bot.sendMessage(chatId, { text: "Erreur lors de la récupération des avertissements... 🛠️" }, { quoted: message });
    }
  }
};
