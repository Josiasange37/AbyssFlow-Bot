module.exports = {
  name: 'help',
  aliases: ['menu', 'commands'],
  description: 'Afficher le menu d\'aide',
  category: 'core',
  async execute({ sock, chatId, message, bot, config, args }) {
    const prefix = config.prefix;
    const isOwner = bot.isOwner(message.key.participant || message.key.remoteJid);
    const userMention = message.key.participant ? message.key.participant.split('@')[0] : message.key.remoteJid.split('@')[0];

    // Group commands by category
    const categories = {};
    bot.commands.forEach((cmd, key) => {
      if (cmd.name.toLowerCase() !== key.toLowerCase()) return;

      const isRestricted = cmd.category === 'admin' || cmd.isOwner;
      if (isRestricted && !isOwner) return;

      const category = cmd.category || 'divers';
      if (!categories[category]) categories[category] = [];
      categories[category].push({
        name: cmd.name,
        description: cmd.description || 'Pas de description'
      });
    });

    const sortedCategories = Object.keys(categories).sort();

    // Pagination Logic: Each category page is now paginated internally if > 10 items
    // Structure: 
    // Page 1: Overview
    // Page 2+: Content pages (Category 1, Category 2, etc.)
    // If a category has 25 commands, it might span Pages 2, 3, 4.

    // Flatten all pages
    const pages = [];

    // 1. Overview Page
    pages.push({ type: 'overview', content: sortedCategories });

    // 2. Category Pages (chunked by 10)
    for (const cat of sortedCategories) {
      const commands = categories[cat];
      const chunkSize = 10;
      for (let i = 0; i < commands.length; i += chunkSize) {
        pages.push({
          type: 'category',
          categoryName: cat,
          content: commands.slice(i, i + chunkSize),
          part: Math.floor(i / chunkSize) + 1,
          totalParts: Math.ceil(commands.length / chunkSize)
        });
      }
    }

    const totalPages = pages.length;

    // Parse page argument
    let pageNum = 1;
    let arg = args[0] ? args[0].toLowerCase() : null;

    // Handle "*help page 1" syntax
    if (arg === 'page' && args[1]) {
      arg = args[1].toLowerCase();
    }

    if (arg) {
      if (arg === 'next') {
        const lastPage = bot.helpPageCache?.get(chatId) || 1;
        pageNum = lastPage >= totalPages ? 1 : lastPage + 1;
      } else if (arg === 'prev') {
        const lastPage = bot.helpPageCache?.get(chatId) || 1;
        pageNum = lastPage <= 1 ? totalPages : lastPage - 1;
      } else if (!isNaN(parseInt(arg))) {
        pageNum = Math.max(1, Math.min(parseInt(arg), totalPages));
      }
    }

    // Cache current page
    if (!bot.helpPageCache) bot.helpPageCache = new Map();
    bot.helpPageCache.set(chatId, pageNum);

    let helpText = [];
    const currentPageData = pages[pageNum - 1];

    if (currentPageData.type === 'overview') {
      helpText = [
        `╔════════════════════════╗`,
        `║  💙 *DIANE - ASSISTANT*  ║`,
        `╚════════════════════════╝`,
        ``,
        `Salut @${userMention} ! 👋`,
        ``,
        `📂 *Index des Catégories:*`,
        ``
      ];

      sortedCategories.forEach((cat, index) => {
        // Find start page for this category
        // Skip page 1 (overview)
        // Count how many chunks previous categories had
        let pageIndex = 2;
        for (let c = 0; c < index; c++) {
          const prevCatCount = categories[sortedCategories[c]].length;
          pageIndex += Math.ceil(prevCatCount / 10);
        }

        const cmdCount = categories[cat].length;
        helpText.push(`  *${index + 1}.* ${cat.toUpperCase()} (${cmdCount} cmds) → Page ${pageIndex}`);
      });

      helpText.push(``);
      helpText.push(`───────────────────────`);
      helpText.push(`💡 *Navigation:*`);
      helpText.push(`> ${prefix}help next → Page Suivante`);
      helpText.push(`> ${prefix}help <num> → Aller à la page`);
      helpText.push(``);
      helpText.push(`📄 Page *${pageNum}/${totalPages}*`);

    } else {
      const { categoryName, content, part, totalParts } = currentPageData;
      const partStr = totalParts > 1 ? ` (${part}/${totalParts})` : '';

      helpText = [
        `╔════════════════════════╗`,
        `║  📂 *${categoryName.toUpperCase()}${partStr}*  ║`,
        `╚════════════════════════╝`,
        ``
      ];

      content.forEach(cmd => {
        helpText.push(`▸ *${prefix}${cmd.name}*`);
        helpText.push(`  ${cmd.description}`);
        helpText.push(``);
      });

      helpText.push(`───────────────────────`);
      helpText.push(`💡 ${prefix}help 1 → Sommaire`);
      helpText.push(`📄 Page *${pageNum}/${totalPages}*`);
    }

    await bot.sendMessage(chatId, {
      text: helpText.join('\n'),
      mentions: [message.key.participant || message.key.remoteJid]
    }, { quoted: message });
  }
};
