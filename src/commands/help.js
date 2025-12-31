module.exports = {
  name: 'help',
  aliases: ['menu', 'commands'],
  description: 'Afficher ce menu d\'aide',
  category: 'core',
  async execute({ sock, chatId, message, bot, config }) {
    const prefix = config.prefix;
    const categories = {};

    const isOwner = bot.isOwner(message.key.participant || message.key.remoteJid);

    // Group commands by category with visibility control
    bot.commands.forEach((cmd, key) => {
      // Avoid duplicates for aliases (only process by primary name)
      if (cmd.name.toLowerCase() !== key.toLowerCase()) return;

      // HIDE ELITE COMMANDS FROM NON-OWNERS
      const isElite = cmd.category === 'offensive' || cmd.category === 'admin' || cmd.isOwner;
      if (isElite && !isOwner) return;

      const category = cmd.category || 'divers';
      if (!categories[category]) categories[category] = [];

      categories[category].push({
        name: cmd.name,
        description: cmd.description || 'pas de description'
      });
    });

    const helpText = [
      `yo ! moi c'est *psycho bot* 🤖`,
      `v'là ce que je peux faire :`,
      ''
    ];

    // Sort categories for consistency
    const sortedCategories = Object.keys(categories).sort();

    for (const cat of sortedCategories) {
      helpText.push(`*${cat.toUpperCase()}*`);
      categories[cat].forEach(cmd => {
        helpText.push(`${prefix}${cmd.name} - ${cmd.description}`);
      });
      helpText.push('');
    }

    helpText.push(`💬 *discuter avec moi*`);
    helpText.push(`tag moi ou répond à un de mes messages pour papoter !`);
    helpText.push('');
    helpText.push(`hésite pas si t'as besoin d'aide 🤝`);

    await bot.sendMessage(chatId, {
      text: helpText.join('\n'),
      mentions: [message.key.participant || message.key.remoteJid]
    }, { quoted: message });
  }
};
