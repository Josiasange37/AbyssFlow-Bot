module.exports = {
  name: 'groupinfo',
  aliases: ['infogroup', 'groupdetails'],
  description: 'Show group information',
  isGroupOnly: true,
  async execute({ sock, chatId, message, bot }) {
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const groupName = groupMetadata.subject || 'Groupe';
      const participants = groupMetadata.participants;
      const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
      const creationDate = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString('fr-FR') : 'Non répertoriée';

      const info = [
        `* \`${bot.botName || 'Diane'}\` *`,
        ``,
        `*RAPPORT D' UNITÉ (GROUPE)*`,
        `Dénomination : \`${groupName}\``,
        `Identification : \`${chatId}\``,
        `Date de Création : \`${creationDate}\``,
        `Population : \`${participants.length} entités\``,
        ``,
        `*Autorités (Admins) :*`,
        admins.map(a => `• @${a.id.split('@')[0]}`).join('\n'),
        '',
        `Description du périmètre : ${groupMetadata.desc || 'Aucune description disponible.'}`,
        '',
        `Document généré par l'assistance exécutive.`
      ].join('\n');

      let pic = null;
      try { pic = await sock.profilePictureUrl(chatId, 'image'); } catch { }

      if (pic) {
        await bot.sendMessage(chatId, { image: { url: pic }, caption: info, mentions: admins.map(a => a.id), quoted: message });
      } else {
        await bot.sendMessage(chatId, { text: info, mentions: admins.map(a => a.id), quoted: message });
      }

    } catch (error) {
      await bot.sendSafeMessage(chatId, `* \`${bot.botName || 'Diane'}\` *\n\n*Erreur*\nImpossible d'extraire les métadonnées de l'unité.`);
    }
  }
};
