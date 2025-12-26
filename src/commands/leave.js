module.exports = {
    name: 'leave',
    description: 'Leave the current group',
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        await bot.sendSafeMessage(chatId, 'Allez ciao la mif, je me retire ! 👋');
        await sock.groupLeave(chatId);
    }
};
