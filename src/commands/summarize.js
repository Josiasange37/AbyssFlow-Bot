const { log } = require('../utils/logger');
const Brain = require('../core/Brain');

module.exports = {
  name: 'summarize',
  aliases: ['recap', 'resume', 'tldr'],
  category: 'info',
  description: 'Résume les dernières discussions du groupe.',
  execute: async ({ sock, chatId, message, bot }) => {
    try {
      await bot.sendMessage(chatId, { text: "Je relis les discussions pour vous faire un topo... 📖✍️" }, { quoted: message });

      const history = await Brain.getHistory(chatId);

      if (history.length < 5) {
        return await bot.sendMessage(chatId, { text: "Pas assez de messages pour résumer pour le moment. 🌵" }, { quoted: message });
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
        await bot.sendMessage(chatId, { text: `📝 *RÉSUMÉ DU FLOW* 📝\n\n${cleanSummary}` }, { quoted: message });
      } else {
        await bot.sendMessage(chatId, { text: "Je n'ai pas pu générer le résumé. 😵‍💫" }, { quoted: message });
      }

    } catch (error) {
      log.error('Summarize Command Error:', error.message);
      await bot.sendMessage(chatId, { text: "Impossible de résumer pour l'instant. 💀" }, { quoted: message });
    }
  }
};
