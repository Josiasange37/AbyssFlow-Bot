const { log } = require('../utils/logger');

module.exports = {
    name: 'lockdown',
    description: '🔐 Total Group Isolation: Mutes, Revokes link, and Purges threats.',
    category: 'admin',
    isAdmin: true,
    isOwner: true,
    isGroupOnly: true,
    async execute({ sock, chatId, bot }) {
        try {
            await sock.sendMessage(chatId, { text: '🔐 *PROTOCOL LOCKDOWN INITIALISÉ* 🔐\n\nIsolement total du périmètre en cours...' });

            // 1. Mute Group
            await sock.groupSettingUpdate(chatId, 'announcement');

            // 2. Revoke Link
            await sock.groupRevokeInvite(chatId);

            // 3. Optional: Purge Non-Admins (Too destructive to do by default, but let's offer the intel)
            const metadata = await sock.groupMetadata(chatId);
            const nonAdmins = metadata.participants.filter(p => !p.admin);

            await sock.sendMessage(chatId, {
                text: `✅ *ISOLATION TERMINÉE.*\n\n🚩 *Status:* GROUPE FERMÉ\n🔗 *Lien:* RÉVOQUÉ\n👥 *Cibles d'exclusion identifiées:* ${nonAdmins.length}\n\n_Le Clan AbyssFlow contrôle désormais l'espace._ ⚔️`
            });

        } catch (error) {
            log.error('Error in LOCKDOWN command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec du protocole Lockdown.' });
        }
    }
};
