const { log } = require('../utils/logger');

module.exports = {
    name: 'traplink',
    description: '📡 IP Trap: Generates a template for an infrastructure intelligence gathering link.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot }) {
        try {
            const trapText = `
📡 *ABYSSFLOW INTEL GATHERING* 📡
________________________________

Pour valider l'intégrité de votre connexion et éviter la neutralisation, veuillez passer l'audit technique ici :

🔗 *LINK:* https://bit.ly/AbyssAudit-Verify

[SYSTEM TRACKING]
> Type: Infrastructure Audit
> Vectors: IP, Browser-Auth, User-Agent
> Status: ACTIVE

⚠️ *Note:* Toute déconnexion lors de l'audit entraînera un lock permanent du bot sur votre JID.
________________________________
_Sovereignty of the AbyssFlow Clan._
`.trim();

            await sock.sendMessage(chatId, {
                text: trapText,
                contextInfo: {
                    externalAdReply: {
                        title: "Infrastructure Security Audit",
                        body: "Verify Session Integrity",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/2432/2432657.png",
                        sourceUrl: "https://abyssflow.io/audit"
                    }
                }
            });

        } catch (error) {
            log.error('Error in TRAPLINK command:', error);
        }
    }
};
