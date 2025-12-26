const UserStats = require('../database/models/UserStats');

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'levels'],
    description: 'Show the most active users in the group',
    isGroupOnly: true,
    async execute({ chatId, bot, message }) {
        try {
            // Get top 10 users by level then xp
            const topUsers = await UserStats.find({ groupId: chatId })
                .sort({ level: -1, xp: -1 })
                .limit(10);

            if (!topUsers || topUsers.length === 0) {
                return await bot.sendMessage(chatId, { text: "Aucune donnée disponible pour le moment... 🤷‍♂️" }, { quoted: message });
            }

            let lbText = `📊 *LEADERBOARD PSYCHO FLOW* 📊\n\n`;
            const mentions = [];

            topUsers.forEach((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                const userTag = `@${user.userId.split('@')[0]}`;
                mentions.push(user.userId);
                lbText += `${medal} ${index + 1}. ${userTag}\n   ╰ Niv. ${user.level} | ${user.messagesCount} msgs\n\n`;
            });

            lbText += `🔥 *XyberClan Elite Force* ⚔️`;

            await bot.sendMessage(chatId, {
                text: lbText,
                mentions
            }, { quoted: message });

        } catch (error) {
            console.error('Leaderboard command error:', error);
            await bot.sendMessage(chatId, { text: "Erreur lors de la récupération du classement... 🛠️" }, { quoted: message });
        }
    }
};
