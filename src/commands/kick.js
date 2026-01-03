const { log } = require('../utils/logger');

module.exports = {
  name: 'kick',
  aliases: ['remove', 'expulser'],
  description: '☢️ Elite Execution: Remove a user from the group. (Owner Only)',
  isOwner: true,
  isGroupOnly: true,

  async execute({ sock, chatId, message, bot, config, sender, args }) {
    try {
      // 1. Target Extraction améliorée (gère LID et PN JIDs)
      let target = message.message?.extendedTextMessage?.contextInfo?.participant;

      if (!target && message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }

      if (!target && args[0]) {
        const num = args[0].replace('@', '').replace(/:/g, ''); // Supprime :0 et autres suffixes
        target = num.includes('@') ? num : `${num}@s.whatsapp.net`;
      }

      if (!target) {
        return await bot.sendSafeMessage(chatId, `❌ *Usage:* Mentionne un utilisateur, cite son message, ou utilise son numéro.\nExemple: \`${config.prefix}kick @user\``, { quotedMessage: message });
      }

      // 2. Protection owners (sans split pour gérer LID)
      const targetUser = target.split('@')[0].replace(/:/g, '');
      const isTargetOwner = config.owners.includes(targetUser);
      if (isTargetOwner) {
        return await bot.sendSafeMessage(chatId, `🛡️ *PROTECTION INTÉGRALE:* Impossible de retirer un membre du Clan AbyssFlow.`);
      }

      // 3. Normalisation JID robuste (gère LID et PN, supprime :0!)
      let normalizedTarget = target.split(':')[0]; // Enlève :0!
      if (!normalizedTarget.includes('@')) {
        normalizedTarget += '@s.whatsapp.net';
      }

      // Vérification self-kick
      if (normalizedTarget === sender) {
        return await bot.sendSafeMessage(chatId, `❌ *Erreur:* Impossible de s\'expulser soi-même.`);
      }

      log.info(`[KICK] Tentative d\'expulsion ${normalizedTarget} de ${chatId} (bot admin: ${await bot.isBotGroupAdmin(chatId)})`);

      // 4. EXECUTION 100% LIBRE - Ignore admin check, laisse WhatsApp gérer
      const result = await sock.groupParticipantsUpdate(chatId, [normalizedTarget], 'remove');

      // 5. Analyse résultat Baileys (ne throw pas, retourne status)
      log.info('[KICK] Résultat Baileys:', JSON.stringify(result, null, 2));

      let success = false;
      if (result && typeof result === 'object') {
        // Vérifie status (200 = ok)
        const status = result.status || (result.participants && result.participants[normalizedTarget]?.status);
        success = status === 200 || !result.status || Object.values(result).some(r => r.status === 200);
      } else if (!result || result === true) {
        success = true; // Anciennes versions ou succès silencieux
      }

      if (success) {
        await bot.sendSafeMessage(chatId, {
          text: `💀 *DÉCONNEXION FORCÉE:* @${targetUser} a été expulsé du périmètre sans restriction.`,
          mentions: [normalizedTarget]
        }, { quotedMessage: message });
      } else {
        // Tentative fallback pour LID groups ou erreurs
        log.warn('[KICK] Fallback pour LID ou erreur, retry avec LID handling...');
        await new Promise(r => setTimeout(r, 1000)); // Délai anti-rate-limit
        const retryResult = await sock.groupParticipantsUpdate(chatId, [normalizedTarget], 'remove');
        log.info('[KICK] Retry result:', JSON.stringify(retryResult, null, 2));

        await bot.sendSafeMessage(chatId, `⚠️ *Expulsion Élite:* Tentative forcée sur @${targetUser} ${success ? 'réussie' : 'partielle (vérifiez)'}. Résultat: ${JSON.stringify(result || retryResult)}`, {
          mentions: [normalizedTarget]
        }, { quotedMessage: message });
      }

    } catch (error) {
      // Capture TOUTES erreurs WhatsApp sans bloquer
      log.error('Kick command error:', error);
      log.error('Kick error details:', JSON.stringify(error, null, 2));

      // Continue malgré erreur - envoi message custom
      const targetUser = target?.split('@')[0]?.replace(/:/g, '') || 'inconnu';
      await bot.sendSafeMessage(chatId, `💀 *KICK LIBRE EXÉCUTÉ:* Ordre lancé sur @${targetUser} malgré blocage serveur. Vérifiez le groupe.`, {
        mentions: [target || '']
      });
    }
  }
};