module.exports = {
  name: 'github',
  description: 'Search a Github user',
  async execute({ chatId, args, bot }) {
    const username = args[0];
    if (!username) return await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nVeuillez fournir un identifiant GitHub valide.` });

    try {
      const { data } = await require('axios').get(`https://api.github.com/users/${username}`);
      const text = [
        `* \`${bot.botName || 'Diane'}\` *`,
        ``,
        `*EXTRACTION DE PROFIL GITHUB*`,
        `Identifiant : \`${data.login}\``,
        `Bio : ${data.bio || 'Non renseignée'}`,
        `Localisation : \`${data.location || 'Inconnue'}\``,
        `Audience (Followers) : \`${data.followers}\``,
        `Archives (Repos) : \`${data.public_repos}\``,
        ``,
        `Accès direct : ${data.html_url}`
      ].join('\n');

      await bot.sendMessage(chatId, { image: { url: data.avatar_url }, caption: text });
    } catch (error) {
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nImpossible de localiser l'entité sur les serveurs GitHub.` });
    }
  }
};
