const UserStats = require('../database/models/UserStats');

module.exports = {
  name: 'purge',
  description: 'Identify inactive members (Ghosts)',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ chatId, args, bot, message }) {
    try {
      const metadata = await bot.sock.groupMetadata(chatId);
      const participants = metadata.participants;
      const total = participants.length;

      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Audit d'Activité*\nAnalyse des flux de données en cours. Veuillez patienter...` }, { quoted: message });

      const stats = await UserStats.find({ groupId: chatId });
      const activeIds = stats.filter(s => s.messagesCount > 0).map(s => s.userId);

      // Ghosts are participants not in activeIds
      // Exclude bot and owner
      const botId = bot.sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const ghosts = participants.filter(p => !activeIds.includes(p.id) && p.id !== botId);

      if (ghosts.length === 0) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Rapport d'Audit*\nAucune entité inactive détectée. Le groupe maintient un niveau d'engagement optimal.` }, { quoted: message });
      }

      let ghostList = `* \`${bot.botName || 'Diane'}\` *\n\n*Identification des Inactifs (${ghosts.length})*\n_Entités n'ayant aucune interaction enregistrée :_\n\n`;

      const mentions = [];
      ghosts.slice(0, 50).forEach((g, i) => { // Limit to 50 for large groups
        const tag = `@${g.id.split('@')[0]}`;
        ghostList += `${i + 1}. ${tag}\n`;
        mentions.push(g.id);
      });

      if (ghosts.length > 50) ghostList += `\n... et ${ghosts.length - 50} autres.`;

      ghostList += `\n\n💡 *Action recommandée :* Procéder au nettoyage administratif si nécessaire.`;

      await bot.sendMessage(chatId, {
        text: ghostList,
        mentions: mentions
      }, { quoted: message });

    } catch (error) {
      console.error('Purge error:', error);
      await bot.sendMessage(chatId, { text: "Erreur lors de l'analyse des fantômes... 🛠️" }, { quoted: message });
    }
  }
};
