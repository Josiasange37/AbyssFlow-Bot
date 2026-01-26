const GroupSettings = require('../database/models/GroupSettings');
const { log } = require('../utils/logger');

module.exports = {
  name: 'settings',
  aliases: ['config', 'setup', 'panel'],
  description: 'Configure bot features for this group',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ chatId, bot, message, args }) {
    try {
      let settings = await bot.getGroupSettings(chatId);

      const toggle = args[0]?.toLowerCase();
      const validToggles = ['welcome', 'antidelete', 'antiedit', 'automod', 'chatbot'];

      if (toggle && validToggles.includes(toggle)) {
        // Mapping toggle names to schema keys
        const mapping = {
          'antidelete': 'antiDelete',
          'antiedit': 'antiEdit',
          'automod': 'autoMod',
          'welcome': 'welcome',
          'chatbot': 'chatbot'
        };
        const key = mapping[toggle];

        settings[key] = !settings[key];

        // Save logic (handle both Mongoose and Plain Object)
        if (typeof settings.save === 'function') {
          await settings.save();
        } else {
          const LocalSettings = require('../database/LocalSettings');
          LocalSettings.set(chatId, { [key]: settings[key] });
        }

        return await bot.sendMessage(chatId, {
          text: `* \`${bot.botName || 'Diane'}\` *\n\n*MISE À JOUR DES PARAMÈTRES*\nParamètre \`${toggle.toUpperCase()}\` : ${settings[key] ? 'ACTIF ✅' : 'INACTIF ❌'}\n\nConfiguration enregistrée avec succès.`
        }, { quoted: message });
      }

      const menu = [
        `* \`${bot.botName || 'Diane'}\` *`,
        ``,
        `*PANNEAU DE CONFIGURATION DE L'UNITÉ*`,
        ``,
        `👋 Welcome : ${settings.welcome ? '`ACTIF ✅`' : '`INACTIF ❌`'}`,
        `   Commande : \`*settings welcome\``,
        ``,
        `🗑️ Anti-Delete : ${settings.antiDelete ? '`ACTIF ✅`' : '`INACTIF ❌`'}`,
        `   Commande : \`*settings antidelete\``,
        ``,
        `✏️ Anti-Edit : ${settings.antiEdit ? '`ACTIF ✅`' : '`INACTIF ❌`'}`,
        `   Commande : \`*settings antiedit\``,
        ``,
        `🛡️ Auto-Mod : ${settings.autoMod ? '`ACTIF ✅`' : '`INACTIF ❌`'}`,
        `   Commande : \`*settings automod\``,
        ``,
        `🧠 AI Chatbot : ${settings.chatbot ? '`ACTIF ✅`' : '`INACTIF ❌`'}`,
        `   Commande : \`*settings chatbot\``,
        ``,
        `Veuillez utiliser les commandes indiquées pour modifier les protocoles.`
      ].join('\n');

      await bot.sendMessage(chatId, { text: menu }, { quoted: message });

    } catch (error) {
      log.error('Settings command failed:', error.message);
      await bot.sendMessage(chatId, { text: `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nÉchec de l'accès au panneau de configuration.` }, { quoted: message });
    }
  }
};
