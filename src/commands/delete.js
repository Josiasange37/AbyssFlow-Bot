module.exports = {
  name: 'delete',
  aliases: ['del', 'sup'],
  description: 'Delete a message (reply to the message)',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ chatId, message, bot }) {
    try {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const key = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const participant = message.message?.extendedTextMessage?.contextInfo?.participant;

      if (!quoted) {
        return await bot.sendMessage(chatId, { text: "Faut répondre à un message pour le supprimer ! 🗑️" }, { quoted: message });
      }

      await bot.sock.sendMessage(chatId, {
        delete: {
          remoteJid: chatId,
          fromMe: false, // We are deleting someone else's message as admin
          id: key,
          participant: participant
        }
      });

    } catch (error) {
      console.error('Delete command error:', error);
      await bot.sendMessage(chatId, { text: "J'arrive pas à supprimer ce message... Je suis bien admin ? 🛡️" }, { quoted: message });
    }
  }
};
