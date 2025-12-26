module.exports = {
    name: 'botstatus',
    aliases: ['botinfo'],
    description: 'Show bot status in the current group',
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata.participants.find(p => p.id === botId);

            const totalMembers = groupMetadata.participants.length;
            const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const isAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

            const statusMsg = [
                `*🤖 Mon Status Ici*`,
                ``,
                `Membres: ${totalMembers}`,
                `Admins: ${admins.length}`,
                ``,
                isAdmin ? `✅ Je suis Admin (tranquille)` : `❌ Je suis pas Admin (mettre moi admin svp)`,
                ``,
                isAdmin ? `Je peux gérer le groupe 😎` : `Je peux rien faire sans les droits 😴`
            ].join('\n');

            await bot.sendSafeMessage(chatId, statusMsg);

        } catch (error) {
            await bot.sendSafeMessage(chatId, `galère pour avoir le status: ${error.message}`);
        }
    }
};
