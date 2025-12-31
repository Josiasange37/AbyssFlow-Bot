const { log } = require('../utils/logger');

module.exports = {
    name: 'encryptspoof',
    description: '🔐 Encryption Vulnerability Demo: Sends a message with manipulated "End-to-End" metadata.',
    category: 'offensive',
    isAdmin: true,
    isOwner: true,
    async execute({ sock, chatId, bot }) {
        try {
            await sock.sendMessage(chatId, {
                text: `🔒 *MESSAGE CHIFFRÉ ABYSSFLOW:* Ce contenu a été injecté via une vulnérabilité de métadonnées chiffrées.`,
                contextInfo: {
                    externalAdReply: {
                        title: "E2EE METADATA AUDIT",
                        body: "Encryption Key: [D̵̮͋E̴̮̚U̵̠͝S̵̪̉-002]",
                        mediaType: 1,
                        thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/3064/3064155.png",
                        sourceUrl: "https://abyssflow.io/protocol"
                    }
                }
            });

        } catch (error) {
            log.error('Error in ENCRYPT-SPOOF:', error);
        }
    }
};
