module.exports = {
  name: 'github',
  description: 'Search a Github user',
  async execute({ chatId, args, bot }) {
    const username = args[0];
    if (!username) return await bot.sendSafeMessage(chatId, 'donne moi un pseudo github ');

    try {
      const { data } = await require('axios').get(`https://api.github.com/users/${username}`);
      const text = [
        `*🐙 Github User: ${data.login}*`,
        `📝 Bio: ${data.bio || 'N/A'}`,
        `📍 Localisation: ${data.location || 'N/A'}`,
        `👥 Followers: ${data.followers}`,
        `📦 Repos: ${data.public_repos}`,
        `🔗 Link: ${data.html_url}`
      ].join('\n');

      await bot.sendMessage(chatId, { image: { url: data.avatar_url }, caption: text });
    } catch (error) {
      await bot.sendSafeMessage(chatId, `pas trouvé cet utilisateur :/`);
    }
  }
};
