module.exports = {
  name: 'add',
  description: 'Ajouter un membre au groupe',
  category: 'admin',
  aliases: ['invite'],
  description: 'Add a user to the group',
  isAdmin: true,
  isGroupOnly: true,
  async execute({ sock, chatId, message, args, bot, config }) {
    try {
      if (args.length === 0) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Aide à l'utilisation*\nSpécifiez un identifiant numérique : \`${config.prefix}add [numéro]\`.`);
        return;
      }

      const numbersToAdd = args.map(arg => arg.replace(/[\s\-\(\)]/g, ''))
        .filter(n => /^\d+$/.test(n))
        .map(n => `${n}@s.whatsapp.net`);

      if (numbersToAdd.length === 0) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur de Données*\nLes identifiants fournis ne sont pas valides.`);
        return;
      }

      const isBotAdmin = await bot.isBotGroupAdmin(chatId);
      if (!isBotAdmin) {
        await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Restriction*\nAccréditation insuffisante. Veuillez me promouvoir Admin.`);
        return;
      }

      const groupMetadata = await sock.groupMetadata(chatId);
      const existingMembers = groupMetadata.participants.map(p => p.id);
      const toAdd = numbersToAdd.filter(jid => !existingMembers.includes(jid));

      if (toAdd.length === 0) {
        await bot.sendSafeMessage(chatId, `ils sont déjà tous là chef.`);
        return;
      }

      const result = await sock.groupParticipantsUpdate(chatId, toAdd, 'add');
      const added = [];
      const failed = [];

      for (const item of result) {
        const status = item.status;
        const jid = item.jid;
        if (status === '200' || status === 200) {
          added.push(jid);
        } else {
          failed.push({ jid, status });
        }
      }

      if (added.length > 0) {
        const addedList = added.map(jid => `• \`${jid.split('@')[0]}\``).join('\n');
        await bot.sendMessage(chatId, {
          text: `* \`${bot.botName || 'Diane'}\` *\n\n*Accès Autorisé*\nNouveaux membres intégrés :\n${addedList}`,
          mentions: added
        });
      }

      if (failed.length > 0) {
        const inviteCode = await sock.groupInviteCode(chatId);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        let invitesSent = 0;

        for (const f of failed) {
          if (f.status == 403) {
            await bot.sendMessage(f.jid, { text: `Salut! Je peux pas t'ajouter direct au groupe, tiens le lien: ${inviteLink}` });
            invitesSent++;
          }
        }

        if (invitesSent > 0) {
          await bot.sendSafeMessage(chatId, `Impossible d'ajouter certains (confidentialité), je leur ai envoyé une invite en DM. 📩`);
        } else if (added.length === 0) {
          await bot.sendSafeMessage(chatId, `J'ai pas réussi à les ajouter. Peut-être qu'ils m'ont bloqué.`);
        }
      }
    } catch (error) {
      await bot.sendSafeMessage(chatId, `galère pour ajouter: ${error.message}`);
    }
  }
};
