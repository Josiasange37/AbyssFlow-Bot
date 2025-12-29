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
      let settings = await GroupSettings.findOne({ groupId: chatId });
      if (!settings) {
        settings = await GroupSettings.create({ groupId: chatId });
      }

      // If an argument is provided, toggle the setting
      const toggle = args[0]?.toLowerCase();
      const validToggles = ['welcome', 'antidelete', 'automod', 'chatbot'];

      if (toggle && validToggles.includes(toggle)) {
        // Map 'antidelete' to 'antiDelete'
        const key = toggle === 'antidelete' ? 'antiDelete' : toggle === 'automod' ? 'autoMod' : toggle;
        settings[key] = !settings[key];
        await settings.save();

        return await bot.sendMessage(chatId, {
          text: `✅ *Réglage mis à jour !*\n\n⚙️ *${toggle.toUpperCase()}:* ${settings[key] ? 'ACTIVÉ 🟢' : 'DÉSACTIVÉ 🔴'}\n\n_Le clan s'adapte à ton flow, ._ 🤙⚡`
        }, { quoted: message });
      }

      // Otherwise, show the stylized menu
      const menu = [
        `🛠️ *XYBER-CONTROL PANEL* 🛠️`,
        `_Gère ton clan avec style ._`,
        ``,
        `🟢 = Activé | 🔴 = Désactivé`,
        ``,
        `👋 *Welcome:* ${settings.welcome ? '🟢' : '🔴'}`,
        `  ╰ _*settings welcome_`,
        ``,
        `🗑️ *Anti-Delete:* ${settings.antiDelete ? '🟢' : '🔴'}`,
        `  ╰ _*settings antidelete_`,
        ``,
        `🛡️ *Auto-Mod:* ${settings.autoMod ? '🟢' : '🔴'}`,
        `  ╰ _*settings automod_`,
        ``,
        `🧠 *AI Chatbot:* ${settings.chatbot ? '🟢' : '🔴'}`,
        `  ╰ _*settings chatbot_`,
        ``,
        `💡 *Astuce:* Tape une commande pour switcher.`,
        ``,
        `⚡ *Flow Psycho Bo * ⚔️`
      ].join('\n');

      await bot.sendMessage(chatId, { text: menu }, { quoted: message });

    } catch (error) {
      log.error('Settings command failed:', error.message);
      await bot.sendMessage(chatId, { text: "Impossible d'ouvrir le panneau de contrôle... 🛠️" }, { quoted: message });
    }
  }
};
