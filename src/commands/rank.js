const UserStats = require('../database/models/UserStats');

module.exports = {
  name: 'rank',
  aliases: ['level', 'lvl', 'xp'],
  description: 'Check your current rank and XP level',
  isGroupOnly: true,
  async execute({ chatId, sender, bot, message }) {
    try {
      const stats = await UserStats.findOne({ userId: sender, groupId: chatId });

      if (!stats) {
        return await bot.sendMessage(chatId, { text: "Tu n'as pas encore de stats , continue à parler ! 🗣️" }, { quoted: message });
      }

      const xpNeeded = stats.level * 100;
      const progress = Math.floor((stats.xp / xpNeeded) * 10);
      const progressBar = '▓'.repeat(progress) + '░'.repeat(10 - progress);

      const userTag = `@${sender.split('@')[0]}`;

      const rankText = [
        `🏆 *PROFIL PSYCHO ELITE* 🏆`,
        ``,
        `👤 *Utilisateur:* ${userTag}`,
        `⭐ *Niveau:* ${stats.level}`,
        `📈 *XP:* ${stats.xp} / ${xpNeeded}`,
        `💬 *Messages:* ${stats.messagesCount}`,
        ``,
        `*Progression:*`,
        `${progressBar} ${Math.floor((stats.xp / xpNeeded) * 100)}%`,
        ``,
        `💪 Continue comme ça !`
      ].join('\n');

      await bot.sendMessage(chatId, {
        text: rankText,
        mentions: [sender]
      }, { quoted: message });

    } catch (error) {
      console.error('Rank command error:', error);
      await bot.sendMessage(chatId, { text: "Impossible de récupérer tes stats pour le moment... 🛠️" }, { quoted: message });
    }
  }
};
