module.exports = {
    name: 'links',
    description: 'Social links for the creator',
    async execute({ chatId, message, bot, config }) {
        const { linkedin, github, portfolio, x, twitter, tiktok, youtube, instagram } = config.creator;

        const links = [
            `si tu veux nous suivre c'est par là 👇`,
            '',
            github ? `💻 github: ${github}` : null,
            linkedin ? `💼 linkedin: ${linkedin}` : null,
            portfolio ? `🌐 site: ${portfolio}` : null,
            x || twitter ? `🐦 twitter: ${x || twitter}` : null,
            tiktok ? `🎵 tiktok: ${tiktok}` : null,
            instagram ? `📸 insta: ${instagram}` : null,
            youtube ? `▶️ youtube: ${youtube}` : null,
            '',
            `allez viens on est bien`
        ].filter(Boolean).join('\n');

        await bot.sendSafeMessage(chatId, links, { quotedMessage: message });
    }
};
