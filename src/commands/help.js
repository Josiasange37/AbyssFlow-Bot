module.exports = {
  name: 'help',
  aliases: ['menu', 'commands'],
  description: 'Affiche la liste des commandes système',
  category: 'core',
  async execute({ sock, chatId, message, bot, config, args }) {
    const prefix = config.prefix;
    const isOwner = bot.isOwner(message.key.participant || message.key.remoteJid);

    // 1. Gather Commands
    const allCommands = [];
    bot.commands.forEach((cmd, key) => {
      if (cmd.name.toLowerCase() !== key.toLowerCase()) return; // Skip aliases

      const isRestricted = cmd.category === 'admin' || cmd.isOwner;
      if (isRestricted && !isOwner) return;

      allCommands.push({
        name: cmd.name,
        category: cmd.category || 'misc',
        desc: cmd.description || 'N/A'
      });
    });

    // 2. Sort by Category then Name
    allCommands.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    // 3. Pagination (5 items per page)
    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(allCommands.length / ITEMS_PER_PAGE);

    // Parse Page Number
    let pageNum = 1;
    let arg = args[0] ? args[0].toLowerCase() : null;
    if (arg === 'next') {
      const lastPage = bot.helpPageCache?.get(chatId) || 1;
      pageNum = lastPage >= totalPages ? 1 : lastPage + 1;
    } else if (arg === 'prev') {
      const lastPage = bot.helpPageCache?.get(chatId) || 1;
      pageNum = lastPage <= 1 ? totalPages : lastPage - 1;
    } else if (!isNaN(parseInt(arg))) {
      pageNum = Math.max(1, Math.min(parseInt(arg), totalPages));
    }

    // Update Cache
    if (!bot.helpPageCache) bot.helpPageCache = new Map();
    bot.helpPageCache.set(chatId, pageNum);

    // 4. Build Display
    const startObj = (pageNum - 1) * ITEMS_PER_PAGE;
    const itemsFn = allCommands.slice(startObj, startObj + ITEMS_PER_PAGE);

    const lines = [];

    lines.push(`*DIANE*`);
    lines.push(``);
    lines.push(`*Aide*`);
    lines.push(`Utilisation : *${prefix}help [commande]* pour plus de détails.`);
    lines.push(``);

    let currentCat = null;
    itemsFn.forEach(cmd => {
      if (cmd.category !== currentCat) {
        currentCat = cmd.category;
        lines.push(`*${currentCat.toUpperCase()}*`);
      }
      lines.push(`• ${cmd.name}`);
    });

    lines.push(``);
    lines.push(`Page *${pageNum}* de *${totalPages}*`);
    lines.push(`Tapez *${prefix}help next* pour la page suivante.`);

    await bot.sendMessage(chatId, {
      text: lines.join('\n'),
      mentions: [message.key.participant || message.key.remoteJid]
    }, { quoted: message });
  }
};
