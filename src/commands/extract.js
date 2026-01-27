const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'extract',
    description: 'Extrait un média View Once de manière anonyme (Owner/Reaction only).',
    category: 'admin',
    aliases: ['vv', 'viewonce'],
    isOwner: true, // Restricted to Bot Owners
    isAdmin: true, // Keeping generic admin flag just in case, but owner check is primary
    execute: async ({ sock, message, bot }) => {
        try {
            // Determine the target chat for the reply (DM)
            const senderJid = message.key.participant || message.key.remoteJid;

            // If triggered by reaction, message object might be different, but we'll standardize in PsychoBot.js or handle here. 
            // For direct command usage:
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const reply = async (text) => {
                // Send feedback to the group (or where command was typed) if desired, 
                // but for "incognito" maybe we only DM? 
                // Original request said "extracted media should be sent directly to the bot user's inbox".
                // Let's keep group reply minimial or nonexistent for incognito?
                // Current implementation sends reply to remoteJid. Let's send a subtle confirmation to group or nothing?
                // Strategy: Send "Processing..." to group (delete after?), send Media to DM.
            };

            if (!quotedMsg) {
                // If run without quote, maybe just return? Or silent fail if we want true stealth?
                // Let's keep a help message if they explicitly typed the command.
                await sock.sendMessage(message.key.remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\nRépondez à un média View Once.` }, { quoted: message });
                return;
            }

            let content = quotedMsg;
            if (content.ephemeralMessage) content = content.ephemeralMessage.message;
            if (content.viewOnceMessage) content = content.viewOnceMessage.message;
            if (content.viewOnceMessageV2) content = content.viewOnceMessageV2.message;
            if (content.viewOnceMessageV2Extension) content = content.viewOnceMessageV2Extension.message;

            const mediaType = content.imageMessage ? 'image' :
                content.videoMessage ? 'video' :
                    content.audioMessage ? 'audio' : null;

            if (!mediaType) {
                await sock.sendMessage(message.key.remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\nType de média non supporté.` }, { quoted: message });
                return;
            }

            const mediaData = content[`${mediaType}Message`];
            if (!mediaData || !mediaData.mediaKey) {
                await sock.sendMessage(message.key.remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\nImpossible de décrypter.` }, { quoted: message });
                return;
            }

            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(mediaData, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const caption = `* \`${bot.botName || 'Diane'}\` *\n\n*Extraction Réussie* 🔓\nDe: Diffusé dans ${message.key.remoteJid.split('@')[0]}\nType: ${mediaType}`;

            // Send to Admin's DM
            await sock.sendMessage(senderJid, { [mediaType]: buffer, caption }, { quoted: null });

            // Optional: React to original message to confirm receipt?
            await sock.sendMessage(message.key.remoteJid, { react: { text: "✅", key: message.key } });

        } catch (err) {
            console.error(err);
            // Silent fail or DM error?
        }
    }
};
