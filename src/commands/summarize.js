const { log } = require('../utils/logger');
const Brain = require('../core/Brain');

module.exports = {
  name: 'summarize',
  aliases: ['resume', 'tldr'],
  category: 'info',
  description: 'Résume les dernières discussions du groupe.',
  execute: async ({ sock, chatId, message }) => {
    try {
      await bot.sendMessage(chatId, { text: "Attends , je relis vos bêtises pour vous faire un topo... 📖✍️" }, { quoted: message });

      const history = await Brain.getHistory(chatId);

      if (history.length < 5) {
        return await bot.sendMessage(chatId, { text: "Y'a pas assez de messages pour résumer là. On dirait un désert ici... 🌵" }, { quoted: message });
      }

      // Prepare the context for the AI
      const conversationText = history
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join('\n');

      const summaryPrompt = `Fais un résumé chronologique, dynamique et drôle des dernières discussions ci-dessous. 
      Utilise des bullet points et ton style habituel (Psycho Bot). 
      Mets en avant les points clés et qui a dit quoi si c'est important.
      
      DISCUSSIONS :
      ${conversationText}`;

      const summary = await Brain.process(summaryPrompt, chatId);

      if (summary) {
        await bot.sendMessage(chatId, { text: `📝 *RÉSUMÉ DU FLOW* 📝\n\n${summary}` }, { quoted: message });
      } else {
        await bot.sendMessage(chatId, { text: "J'ai essayé de résumer mais mon cerveau a buggé. Trop de bruits pour rien dans ce groupe ! 😵‍💫" }, { quoted: message });
      }

    } catch (error) {
      log.error('Summarize Command Error:', error.message);
      await bot.sendMessage(chatId, { text: "Impossible de résumer pour l'instant. Le est total. 💀" }, { quoted: message });
    }
  }
};
