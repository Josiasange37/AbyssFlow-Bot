const { log } = require('../utils/logger');

module.exports = {
    name: 'devicewipe',
    description: '☢️ Device-Wipe: Sends an extremely realistic fake notification of a remote device wipe.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, message, args, bot }) {
        try {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant ||
                (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : chatId);

            const wipeText = `
☢️ *PROTOCOLE DE PURGE À DISTANCE* ☢️
________________________________

[ INITIATION_DU_WIPE_TOTAL ]
*Cible:* Mobile Device (Android/iOS)
*Agent:* AbyssFlow Master Auditor
*Status:* EN COURS (34%)

Les fichiers système, la galerie, et les bases de données chiffrées sont en cours d'écrasement par des secteurs de zéros.

⚠️ *INFO:* Votre appareil sera réinitialisé d'usine dans 60 secondes pour finaliser l'effacement. Toute déconnexion du réseau est inutile.
________________________________
`.trim();

            await sock.sendMessage(target, {
                text: wipeText,
                contextInfo: {
                    externalAdReply: {
                        title: "SYSTEM CRITICAL: Remote Wipe Active",
                        body: "Wiping all local data and partitions.",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/3282/3282645.png",
                        sourceUrl: "https://google.com/android/find"
                    }
                }
            });

            if (target !== chatId) {
                await sock.sendMessage(chatId, { text: `☢️ *DEVICE-WIPE SIMULATION* déployée sur @${target.split('@')[0]}.`, mentions: [target] });
            }

        } catch (error) {
            log.error('Error in DEVICEWIPE:', error);
        }
    }
};
