module.exports = {
    name: 'pp',
    description: 'Télécharge la photo de profil (HD) de la personne mentionnée ou répondue.',
    category: 'tools',
    aliases: ['profilepic', 'dp'],
    execute: async ({ sock, message, bot }) => {
        try {
            const remoteJid = message.key.remoteJid;
            const isGroup = remoteJid.endsWith('@g.us');
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const contextInfo = message.message?.extendedTextMessage?.contextInfo;

            let targetJid;

            if (quotedMsg) {
                targetJid = contextInfo.participant || contextInfo.mentionedJid?.[0];
            } else if (contextInfo?.mentionedJid?.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
            } else if (!isGroup) {
                // In DM, if no mention, get the other person's PP (remoteJid)
                targetJid = remoteJid;
            } else {
                return await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Mentionnez quelqu'un ou répondez à un message.` }, { quoted: message });
            }

            if (!targetJid) return;

            // Owner Protection (Optional based on user request)
            // const OWNER_PN = "...";
            // const cleanTarget = targetJid.split(':')[0].split('@')[0];
            // if (cleanTarget === OWNER_PN) ...

            try {
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                console.log('[PP DEBUG] URL:', ppUrl);

                if (!ppUrl) throw new Error('No profile picture URL returned');

                const { default: axios } = require('axios');
                const response = await axios.get(ppUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://web.whatsapp.com/'
                    }
                });

                const buffer = Buffer.from(response.data);
                console.log(`[PP DEBUG] Buffer length: ${buffer.length}, Header: ${buffer.toString('hex', 0, 8)}`);

                if (buffer.length === 0) throw new Error('Downloaded buffer is empty');

                await sock.sendMessage(remoteJid, { image: buffer, caption: `* \`${bot.botName || 'Diane'}\` *\n\n📸 *Photo de Profil*` }, { quoted: message });
            } catch (e) {
                console.error('[PP DEBUG] Error:', e.message);
                await sock.sendMessage(remoteJid, { text: `* \`${bot.botName || 'Diane'}\` *\n\n⚠️ Erreur: ${e.message}` }, { quoted: message });
            }

        } catch (err) {
            console.error('[PP Error]:', err);
        }
    }
};
