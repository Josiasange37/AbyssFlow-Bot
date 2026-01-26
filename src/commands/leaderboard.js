const UserStats = require('../database/models/UserStats');

module.exports = {
  name: 'leaderboard',
  aliases: ['top', 'levels'],
  description: 'Show the most active users in the group',
  isGroupOnly: true,
  async execute({ chatId, bot, message }) {
    try {
      const topUsers = await UserStats.find({ groupId: chatId })
        .sort({ level: -1, xp: -1 })
        .limit(10);

      if (!topUsers || topUsers.length === 0) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Alerte*\nAucune donnée d'interaction disponible dans les registres.` }, { quoted: message });
      }

      let lbText = `* \`${bot.botName || 'Diane'}\` *\n\n*REGISTRE DE PRODUCTIVITÉ OPÉRATIVE*\n\n`;
      const mentions = [];

      topUsers.forEach((user, index) => {
        const userTag = `@${user.userId.split('@')[0]}`;
        mentions.push(user.userId);
        lbText += `[\`${index + 1}\`] • ${userTag}\n  ╰ Grade : \`${user.level}\` | Interactions : \`${user.messagesCount}\`\n\n`;
      });

      lbText += `*Données archivées avec succès.*`;

      await bot.sendMessage(chatId, {
        text: lbText,
        mentions
      }, { quoted: message });

    } catch (error) {
      console.error('Leaderboard command error:', error);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nAccès au registre de productivité restreint.` }, { quoted: message });
    }
  }
};
