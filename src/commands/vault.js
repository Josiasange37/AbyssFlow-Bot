const { log } = require('../utils/logger');
const crypto = require('crypto');

// Master Secret for Vault (In production, this should be in .env)
const MASTER_SECRET = process.env.VAULT_SECRET || 'AbyssFlow_Security_Audit_2025';

module.exports = {
    name: 'vault',
    description: '🔐 Zero-Knowledge Encryption: Encrypts or decrypts messages for secure transit.',
    category: 'admin',
    isAdmin: true,
    async execute({ sock, chatId, message, args }) {
        try {
            const action = args[0]?.toLowerCase();
            const text = args.slice(1).join(' ');

            if (action === 'enc' && text) {
                const cipher = crypto.createCipher('aes-256-cbc', MASTER_SECRET);
                let encrypted = cipher.update(text, 'utf8', 'hex');
                encrypted += cipher.final('hex');

                return await sock.sendMessage(chatId, {
                    text: `🔐 *MESSAGE SÉCURISÉ GÉNÉRÉ* 🔐\n\n\`\`\`${encrypted}\`\`\`\n\n_Note: Seuls ceux possédant la clé AbyssFlow peuvent lire ce payload._`
                });
            }

            if (action === 'dec' && text) {
                try {
                    const decipher = crypto.createDecipher('aes-256-cbc', MASTER_SECRET);
                    let decrypted = decipher.update(text, 'hex', 'utf8');
                    decrypted += decipher.final('utf8');

                    return await sock.sendMessage(chatId, {
                        text: `🔓 *MESSAGE DÉCRYPTÉ* 🔓\n\n> ${decrypted}`
                    });
                } catch (e) {
                    return await sock.sendMessage(chatId, { text: '❌ *Erreur:* Paylaod corrompu ou clé invalide.' });
                }
            }

            await sock.sendMessage(chatId, {
                text: '❌ *Usage:* \n`*vault enc <message>` (Crypter)\n`*vault dec <hex_code>` (Décrypter)'
            });

        } catch (error) {
            log.error('Error in VAULT command:', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de l\'opération cryptographique.' });
        }
    }
};
