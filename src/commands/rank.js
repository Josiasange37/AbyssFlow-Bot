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
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Alerte*\nAucune donnée enregistrée pour cette entité. Veuillez augmenter votre taux d'interaction.` }, { quoted: message });
      }

      const xpNeeded = stats.level * 100;
      const progress = Math.floor((stats.xp / xpNeeded) * 10);
      const progressBar = '▓'.repeat(progress) + '░'.repeat(10 - progress);

      const userTag = `@${sender.split('@')[0]}`;

      const rankText = [
        `* \`${bot.botName || 'Diane'}\` *`,
        ``,
        `*FICHE D'IDENTIFICATION OPÉRATIVE*`,
        `Entité : \`${userTag}\``,
        `Crédibilité (Level) : \`${stats.level}\``,
        `Expérience (XP) : \`${stats.xp} / ${xpNeeded}\``,
        `Volume d'Interactions : \`${stats.messagesCount}\``,
        ``,
        `*Progression de Carrière :*`,
        `|${progressBar}| ${Math.floor((stats.xp / xpNeeded) * 100)}%`,
        ``,
        `Maintenez un niveau d'engagement élevé.`
      ].join('\n');

      await bot.sendMessage(chatId, {
        text: rankText,
        mentions: [sender]
      }, { quoted: message });

    } catch (error) {
      console.error('Rank command error:', error);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nImpossible d'accéder aux registres de productivité pour le moment.` }, { quoted: message });
    }
  }
};
