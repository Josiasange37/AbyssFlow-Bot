const { log } = require('../utils/logger');

module.exports = {
  name: 'kick',
  aliases: ['remove', 'expulser'],
  description: '☢️ Elite Execution: Remove a user from the group. (Owner Only)',
  isOwner: true,
  isGroupOnly: true,

  async execute({ sock, chatId, message, bot, config, sender, args }) {
    try {
      // 1. Target Extraction (Priority: Quoted Message > Mentions > Args)
      let target = message.message?.extendedTextMessage?.contextInfo?.participant;

      if (!target && message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }

      if (!target && args[0]) {
        target = args[0].replace('@', '') + '@s.whatsapp.net';
      }

      if (!target) {
        return await bot.sendSafeMessage(chatId, `❌ *Usage:* Mentionne un utilisateur, cite son message, ou utilise son numéro.\nExemple: \`${config.prefix}kick @user\``, { quotedMessage: message });
      }

      // 2. Permission Validation
      const isBotAdmin = await bot.isBotGroupAdmin(chatId);
      if (!isBotAdmin) {
        return await bot.sendSafeMessage(chatId, `❌ *Erreur:* Je ne suis pas administrateur. Impossible d'exécuter la sentence.`);
      }

      // 3. Safety Protection (Don't kick owners)
      const isTargetOwner = config.owners.includes(target.split('@')[0]);
      if (isTargetOwner) {
        return await bot.sendSafeMessage(chatId, `🛡️ *PROTECTION INTÉGRALE:* Impossible de retirer un membre du Clan AbyssFlow.`);
      }

      // 4. Normalize JID for Baileys (remove :0 suffix if present, ensure @s.whatsapp.net)
      let normalizedTarget = target.split(':')[0];
      if (!normalizedTarget.includes('@')) {
        normalizedTarget = normalizedTarget + '@s.whatsapp.net';
      }

      log.info(`[KICK] Attempting to remove ${normalizedTarget} from ${chatId}`);

      // 5. Execution
      await sock.groupParticipantsUpdate(chatId, [normalizedTarget], 'remove');

      await bot.sendSafeMessage(chatId, {
        text: `💀 *DÉCONNEXION FORCÉE:* @${normalizedTarget.split('@')[0]} a été expulsé du périmètre.`,
        mentions: [normalizedTarget]
      });

    } catch (error) {
      log.error('Kick command error:', error);
      log.error('Kick error details:', JSON.stringify(error, null, 2));
      await bot.sendSafeMessage(chatId, `❌ *Echec de l'expulsion:* ${error.message || 'Erreur inconnue'}`);
    }
  }
};

