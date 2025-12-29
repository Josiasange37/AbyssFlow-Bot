module.exports = {
  name: 'stats',
  description: 'Show bot statistics',
  isOwner: true,
  async execute({ chatId, bot, message }) {
    const uptime = bot.formatDuration(Date.now() - bot.metrics.startedAt);
    const chats = await bot.sock.groupFetchAllParticipating();
    const groupCount = Object.keys(chats).length;

    const stats = [
      `📊 *Psycho Stats*`,
      ``,
      `⏱️ Uptime: ${uptime}`,
      `👥 Groupes: ${groupCount}`,
      `📩 Msgs reçus: ${bot.metrics.messagesProcessed}`,
      `⚡ Commandes: ${bot.commandCount}`,
      `🏓 Latence: ${Date.now() - bot.metrics.lastPingAt || 0}ms`,
      ``,
      `🌊 _Water Hashira_`
    ].join('\n');

    await bot.sendSafeMessage(chatId, stats, { quotedMessage: message });
  }
};
