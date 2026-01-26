module.exports = {
  name: 'stats',
  description: 'Show bot statistics',
  isOwner: true,
  async execute({ chatId, bot, message }) {
    const uptime = bot.formatDuration(Date.now() - bot.metrics.startedAt);
    const chats = await bot.sock.groupFetchAllParticipating();
    const groupCount = Object.keys(chats).length;

    const stats = [
      `* \`${config.botName || 'Diane'}\` *`,
      ``,
      `*Statistiques Système*`,
      `• Disponibilité : \`${uptime}\``,
      `• Unités (Groupes) : \`${groupCount}\``,
      `• Flux de données : \`${bot.metrics.messagesProcessed} msgs\``,
      `• Commandes traitées : \`${bot.commandCount}\``,
      `• Latence réseau : \`${Date.now() - bot.metrics.lastPingAt || 0}ms\``,
      ``,
      `*Diagnostic effectué avec succès.*`
    ].join('\n');

    await bot.sendSafeMessage(chatId, stats, { quotedMessage: message });
  }
};
