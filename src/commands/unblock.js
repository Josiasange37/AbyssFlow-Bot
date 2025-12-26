module.exports = {
    name: 'unblock',
    description: 'Unblock a user',
    isOwner: true,
    async execute({ sock, chatId, message, bot }) {
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJids.length === 0) {
            return await bot.sendSafeMessage(chatId, 'tag qui tu veux débloquer bg');
        }
        for (const jid of mentionedJids) {
            await sock.updateBlockStatus(jid, 'unblock');
            await bot.sendSafeMessage(chatId, `✅ @${jid.split('@')[0]} est débloqué`, { mentions: [jid] });
        }
    }
};
