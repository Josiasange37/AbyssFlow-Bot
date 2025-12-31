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
      `🔳 *ABYSSFLOW_AUDITOR_V3.1: SOVEREIGN_DOMINANCE*`,
      `📡 *IDENTIFIED_SUBJECT:* @${message.key.participant ? message.key.participant.split('@')[0] : message.key.remoteJid.split('@')[0]}`,
      `📦 *ENVIRONMENT:* AbyssFlow Protocol v4_Spf`,
      '',
      'AVAILABLE_PROTOCOLS:',
      '________________________________'
    ];

    // Sort categories for consistency
    const sortedCategories = Object.keys(categories).sort();

    for (const cat of sortedCategories) {
      helpText.push(`\n*${cat.toUpperCase()}_SECTION*`);
      categories[cat].forEach(cmd => {
        helpText.push(`> ${prefix}${cmd.name.toUpperCase()} - ${cmd.description}`);
      });
    }

    helpText.push('');
    helpText.push('________________________________');
    helpText.push(`🤖 *NEURAL_INTERFACE_STATUS:* ACTIVE`);
    helpText.push(`> Direct Tagging or Reply triggers AI intervention.`);
    helpText.push('');
    helpText.push(`⚠️ *SECURITY_NOTICE:* Unauthorized access to elite protocols is prohibited.`);

    await bot.sendMessage(chatId, {
      text: helpText.join('\n'),
      mentions: [message.key.participant || message.key.remoteJid]
    }, { quoted: message });
  }
};
