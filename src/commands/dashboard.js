const UserStats = require('../database/models/UserStats');
const sharp = require('sharp');
const axios = require('axios');
const { log } = require('../utils/logger');

module.exports = {
  name: 'dashboard',
  aliases: ['db', 'status', 'groupstatus'],
  description: 'Get a visual dashboard of the group activity',
  isGroupOnly: true,
  async execute({ chatId, bot, message }) {
    try {
      await bot.sendMessage(chatId, { text: "📊 Génération du Xyber-Dashboard... ⏳" }, { quoted: message });

      const metadata = await bot.sock.groupMetadata(chatId);
      const stats = await UserStats.find({ groupId: chatId }).sort({ level: -1, xp: -1 }).limit(5);
      const totalMembers = metadata.participants.length;
      const activeCount = await UserStats.countDocuments({ groupId: chatId, messagesCount: { $gt: 0 } });

      const groupName = metadata.subject;
      const topUser = stats[0] ? stats[0].userId.split('@')[0] : "Aucun";

      // Generate SVG for Dashboard
      const width = 800;
      const height = 500;

      const svgDashboard = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f0c29;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#302b63;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#24243e;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)" rx="20" />
        
        <text x="40" y="60" font-family="Arial" font-size="35" fill="#00d2ff" font-weight="bold">XYBER-DASHBOARD</text>
        <text x="40" y="100" font-family="Arial" font-size="20" fill="#aaa">${groupName.toUpperCase()}</text>
        
        <!-- Stats Grid -->
        <rect x="40" y="140" width="220" height="120" fill="rgba(255,255,255,0.05)" rx="15" />
        <text x="60" y="180" font-family="Arial" font-size="18" fill="#fff">Membres</text>
        <text x="60" y="230" font-family="Arial" font-size="40" fill="#00d2ff" font-weight="bold">${totalMembers}</text>
        
        <rect x="290" y="140" width="220" height="120" fill="rgba(255,255,255,0.05)" rx="15" />
        <text x="310" y="180" font-family="Arial" font-size="18" fill="#fff">Actifs (XP)</text>
        <text x="310" y="230" font-family="Arial" font-size="40" fill="#2ecc71" font-weight="bold">${activeCount}</text>
        
        <rect x="540" y="140" width="220" height="120" fill="rgba(255,255,255,0.05)" rx="15" />
        <text x="560" y="180" font-family="Arial" font-size="18" fill="#fff">Top Rank</text>
        <text x="560" y="230" font-family="Arial" font-size="25" fill="#f1c40f" font-weight="bold">@${topUser}</text>
        
        <!-- Activity Bar -->
        <text x="40" y="320" font-family="Arial" font-size="22" fill="#fff" font-weight="bold">Santé du Groupe</text>
        <rect x="40" y="340" width="720" height="40" fill="rgba(255,255,255,0.1)" rx="20" />
        <rect x="40" y="340" width="${Math.min(720, (activeCount / totalMembers) * 720)}" height="40" fill="#00d2ff" rx="20" />
        <text x="40" y="410" font-family="Arial" font-size="16" fill="#aaa">Un clan puissant est un clan actif. ⚔️⚡</text>
      </svg>`;

      const dashboardBuffer = await sharp(Buffer.from(svgDashboard)).png().toBuffer();

      await bot.sendMessage(chatId, {
        image: dashboardBuffer,
        caption: `📊 *XYBER-DASHBOARD [ ${groupName} ]* 📊\n\n🛡️ *Santé:* ${Math.round((activeCount / totalMembers) * 100)}%\n🏅 *Top:* @${topUser}\n👥 *Clan:* ${totalMembers} membres\n\n_Données extraites par Psycho Bot._ 🤙⚡`,
        mentions: stats[0] ? [stats[0].userId] : []
      }, { quoted: message });

    } catch (error) {
      log.error('Dashboard command failed:', error.message);
      await bot.sendMessage(chatId, { text: "Erreur lors de la génération du dashboard... 🛠️" }, { quoted: message });
    }
  }
};
