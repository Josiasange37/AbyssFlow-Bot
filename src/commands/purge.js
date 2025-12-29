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

      await bot.sendMessage(chatId, { text: "🔍 Analyse de l'activité en cours... Ça peut prendre un moment . ⏳" }, { quoted: message });

      const stats = await UserStats.find({ groupId: chatId });
      const activeIds = stats.filter(s => s.messagesCount > 0).map(s => s.userId);

      // Ghosts are participants not in activeIds
      // Exclude bot and owner
      const botId = bot.sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const ghosts = participants.filter(p => !activeIds.includes(p.id) && p.id !== botId);

      if (ghosts.length === 0) {
        return await bot.sendMessage(chatId, { text: "🚀 Incroyable ! Tout le monde est actif dans ce groupe. Aucun fantôme détecté. 🤙🔥" }, { quoted: message });
      }

      let ghostList = `👻 *LISTE DES FANTÔMES (${ghosts.length})* 👻\n\n`;
      ghostList += `_Ces membres n'ont jamais parlé depuis que je suis là (ou ont 0 XP)._\n\n`;

      const mentions = [];
      ghosts.slice(0, 50).forEach((g, i) => { // Limit to 50 for large groups
        const tag = `@${g.id.split('@')[0]}`;
        ghostList += `${i + 1}. ${tag}\n`;
        mentions.push(g.id);
      });

      if (ghosts.length > 50) ghostList += `\n... et ${ghosts.length - 50} autres.`;

      ghostList += `\n\n💡 _Utilise ton admin power pour faire le ménage ! 🧹_`;

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
