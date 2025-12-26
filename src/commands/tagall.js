module.exports = {
    name: 'tagall',
    aliases: ['everyone', 'mentionall'],
    description: 'Tag all group members',
    isAdmin: true,
    isGroupOnly: true,
    async execute({ sock, chatId, args, bot }) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants.map(p => p.id);

            if (participants.length === 0) return;

            const customMessage = args.join(' ') || '📢 Annonce';

            const tagMessage = [
                customMessage,
                '',
                participants.map(jid => `@${jid.split('@')[0]}`).join(' ')
            ].join('\n');

            await bot.sendMessage(chatId, {
                text: tagMessage,
                mentions: participants
            });

        } catch (error) {
            await bot.sendSafeMessage(chatId, `oops j'ai pas réussi à invoquer tout le monde`);
        }
    }
};
