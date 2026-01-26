module.exports = {
  name: 'ping',
  description: 'Check bot latency and uptime',
  async execute({ sock, chatId, message, bot }) {
    const now = Date.now();
    const messageTs = Number(message.messageTimestamp || 0) * 1000;
    const latency = Math.max(0, messageTs ? now - messageTs : 0);
    const uptime = now - bot.metrics.startedAt;

    bot.metrics.lastPingAt = now;

    const response = [
      `* \`${bot.botName || 'Diane'}\` *`,
      ``,
      `*Statut de Connectivité*`,
      `• Latence : \`${latency}ms\``,
      `• Session : \`${bot.formatDuration(uptime)}\``,
      `• État : \`OPÉRATIONNEL\``
    ].join('\n');
    await bot.sendMessage(chatId, { text: response }, { quoted: message });
  }
};
