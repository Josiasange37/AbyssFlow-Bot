const { log } = require('../utils/logger');
const { delay } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'clone',
    description: '🎭 Deep Identity Clone: Copy target\'s Name, Status, and Profile Picture.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);

            if (args[0]?.toLowerCase() === 'restore') {
                const backupPath = path.join(process.cwd(), 'data', 'backups', 'original_profile.json');
                if (fs.existsSync(backupPath)) {
                    const backup = await fs.readJson(backupPath);
                    await sock.updateProfileName(backup.name || "AbyssFlow Auditor");
                    await sock.updateProfileStatus(backup.status || "AbyssFlow | Master Technical Auditor");
                    // PP restoration is complex without the raw image, usually requires manual set or a saved local image
                    await sock.sendMessage(chatId, { text: '🎭 *RESTAURATION PARTIELLE:* Nom et Statu rétablis. Pour la photo, utilise *setpp*.' });
                } else {
                    await sock.sendMessage(chatId, { text: '❌ Aucune sauvegarde de profil trouvée.' });
                }
                return;
            }

            if (!target) return await sock.sendMessage(chatId, { text: '❌ Cible manquante.' });

            await sock.sendMessage(chatId, { text: `🎭 *INITIATION DE L'INFILTRATION:* Clonage de @${target.split('@')[0]}...`, mentions: [target] });

            // 1. Backup Current Identity (One time)
            const backupDir = path.join(process.cwd(), 'data', 'backups');
            await fs.ensureDir(backupDir);
            const backupPath = path.join(backupDir, 'original_profile.json');
            if (!fs.existsSync(backupPath)) {
                // We'd ideally fetch our own info here, but for now we use known defaults or manually set
                await fs.writeJson(backupPath, { name: bot.botName, status: "AbyssFlow | Master Technical Auditor" });
            }

            // 2. Fetch Target Info
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(target, 'image');
            } catch (e) {
                log.debug(`Could not fetch PP for ${target}`);
            }

            const status = await sock.fetchStatus(target).catch(() => ({ status: "" }));
            const contact = await sock.onWhatsApp(target);
            const name = contact[0]?.notify || target.split('@')[0];

            // 3. Apply Identity
            await sock.updateProfileName(name);
            if (status.status) await sock.updateProfileStatus(status.status);

            if (ppUrl) {
                const response = await require('axios').get(ppUrl, { responseType: 'arraybuffer' });
                await sock.updateProfilePicture(sock.user.id, Buffer.from(response.data));
            }

            await sock.sendMessage(chatId, {
                text: `👁️ *INFILTRATION RÉUSSIE.* Je suis désormais @${target.split('@')[0]}.\n\n_Utilise *clone restore* pour revenir en arrière._`,
                mentions: [target]
            });

        } catch (error) {
            log.error('Error in CLONE command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'infiltration.' });
        }
    }
};
