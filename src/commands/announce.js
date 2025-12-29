const { simulateTyping } = require('../utils/helpers');
const log = require('../utils/logger');

module.exports = {
  name: 'announce',
  aliases: ['broadcast'],
  description: 'Global broadcast to all groups',
  isOwner: true,
  async execute({ sock, chatId, args, bot }) {
    const text = args.join(' ');
    if (!text) {
      await bot.sendSafeMessage(chatId, `faut écrire un truc à diffuser .\nEx: ${bot.config.prefix}announce C'est l'heure !`);
      return;
    }

    try {
      const chats = await sock.groupFetchAllParticipating();
      const groups = Object.values(chats).filter(chat => chat.id.endsWith('@g.us'));

      await bot.sendSafeMessage(chatId, `🚀 Diffusion lancée vers ${groups.length} groupes...`);
      await bot.sendSafeMessage(chatId, `⚠️ Attention: Ça peut prendre du temps pour éviter le ban.`);

      let sent = 0;
      for (const group of groups) {
        try {
          // Safety Delay: 2-5 seconds between messages
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

          await simulateTyping(sock, group.id, 1000);
          await bot.sendMessage(group.id, { text: `📢 *ANNONCE OFFICIELLE*\n\n${text}` });
          sent++;

          if (sent % 10 === 0) {
            await bot.sendSafeMessage(chatId, `⏳ ${sent}/${groups.length} envoyés...`);
          }
        } catch (e) {
          log.error(`Announce failed for ${group.id}:`, e.message);
        }
      }

      await bot.sendSafeMessage(chatId, `✅ Terminé! Message envoyé à ${sent}/${groups.length} groupes.`);
    } catch (error) {
      log.error('Announce global error:', error.message);
      await bot.sendSafeMessage(chatId, `Erreur lors de la diffusion: ${error.message}`);
    }
  }
};
