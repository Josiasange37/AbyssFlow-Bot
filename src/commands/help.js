module.exports = {
  name: 'help',
  aliases: ['menu', 'commands'],
  description: 'Affiche la liste des commandes système',
  category: 'core',
  async execute({ sock, chatId, message, bot, config, args }) {
    const prefix = config.prefix;
    const isOwner = bot.isOwner(message.key.participant || message.key.remoteJid);

    // 1. Gather Commands & Group by Category
    const categories = {};
    bot.commands.forEach((cmd, key) => {
      if (cmd.name.toLowerCase() !== key.toLowerCase()) return; // Skip aliases
      const isRestricted = cmd.category === 'admin' || cmd.isOwner;
      if (isRestricted && !isOwner) return;

      const cat = cmd.category || 'diverse';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.name);
    });

    const sortedCats = Object.keys(categories).sort();

    // 2. Build Pages (Max 5 per page, NO MIXING categories)
    const pages = [];
    for (const cat of sortedCats) {
      const cmds = categories[cat].sort();
      const ITEMS_PER_PAGE = 5;
      for (let i = 0; i < cmds.length; i += ITEMS_PER_PAGE) {
        pages.push({
          category: cat.toUpperCase(),
          commands: cmds.slice(i, i + ITEMS_PER_PAGE)
        });
      }
    }

    const totalPages = pages.length;

    // 3. Parse Page Number
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

    // 4. Build Display Output
    const currentPage = pages[pageNum - 1];
    const lines = [];

    lines.push(`* \`${bot.botName || 'Diane'}\` *`);
    lines.push(``);
    lines.push(`*Aide*`);
    lines.push(`Utilisation : \`${prefix}help [commande]\``);
    lines.push(``);
    lines.push(`*${currentPage.category}*`);

    currentPage.commands.forEach(cmdName => {
      lines.push(` \`• ${cmdName}\` `);
    });

    lines.push(``);
    lines.push(` \`Page ${pageNum} sur ${totalPages}\` `);
    lines.push(`Tapez \`${prefix}help next\` pour la suite.`);

    await bot.sendMessage(chatId, {
      text: lines.join('\n'),
      mentions: [message.key.participant || message.key.remoteJid]
    }, { quoted: message });
  }
};
