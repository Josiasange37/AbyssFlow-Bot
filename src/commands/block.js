module.exports = {
    name: 'block',
    description: 'Block a user',
    isOwner: true,
    async execute({ sock, chatId, message, bot }) {
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJids.length === 0) {
            return await bot.sendSafeMessage(chatId, 'tag qui tu veux bloquer bg');
        }
        for (const jid of mentionedJids) {
            await sock.updateBlockStatus(jid, 'block');
            await bot.sendSafeMessage(chatId, `✅ @${jid.split('@')[0]} est bloqué`, { mentions: [jid] });
        }
    }
};
