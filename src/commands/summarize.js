const { log } = require('../utils/logger');
const Brain = require('../core/Brain');

module.exports = {
  name: 'summarize',
  aliases: ['recap', 'resume', 'tldr'],
  category: 'info',
  description: 'Résume les dernières discussions du groupe.',
  execute: async ({ sock, chatId, message, bot }) => {
    try {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Analyse de Rapport*\nSynthèse des flux de communication en cours de traitement...` }, { quoted: message });

      const history = await Brain.getHistory(chatId);

      if (history.length < 5) {
        return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Données Insuffisantes*\nLe volume de messages est trop faible pour générer un rapport cohérent.` }, { quoted: message });
      }

      // Prepare the context for the AI
      const conversationText = history
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join('\n');

      const summaryPrompt = `Fais un résumé chronologique, dynamique et professionnel des dernières discussions ci-dessous. 
      Utilise des bullet-points. 
      Mets en avant les points clés et qui a dit quoi.
      
      DISCUSSIONS :
      ${conversationText}`;

      const summary = await Brain.process(summaryPrompt, chatId, null, "Système de Résumé");

      if (summary) {
        // Remove AI metadata if any
        const cleanSummary = summary.replace(/\[MEMORY: .*?\]/g, '').trim();
        await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Rapport de Synthèse Exécutive*\n\n${cleanSummary}` }, { quoted: message });
      } else {
        await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de la génération du rapport.` }, { quoted: message });
      }

    } catch (error) {
      log.error('Summarize Command Error:', error.message);
      await bot.sendMessage(chatId, { text: "Impossible de résumer pour l'instant. 💀" }, { quoted: message });
    }
  }
};
