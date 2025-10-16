# 🌊 AbyssFlow WhatsApp Bot

<div align="center">

**Advanced WhatsApp Bot powered by Baileys with enhanced security and group management features**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-6.7.5-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Features

### 🎯 Public Commands
- **`*ping`** - Check bot latency and uptime
- **`*help`** - Comprehensive command menu
- **`*about`** - Creator profile with Water Hashira theme
- **`*links`** - All social media and contact links
- **`*git`** - Creator's GitHub profile with stats
- **`*github <username>`** - Search any GitHub user profile
- **`*whoami`** - Debug command to identify user's WhatsApp JID
- **`*groupinfo`** - Display group information with photo, description, and admins

### 👑 Group Admin Commands
- **`*welcome`** - Configure automatic welcome messages
- **`*goodbye`** - Configure automatic goodbye messages
- **`*kick`** / **`*remove`** - Expel members from group
- **`*add`** / **`*invite`** - Add members to group
- **`*tagall`** / **`*everyone`** - Mention all group members
- **`*botstatus`** - Check bot's status in group

### 🔐 Security Features
- Multi-owner authentication
- Rate limiting (12 commands/minute)
- Anti-spam protection
- Request throttling
- Session management
- Group admin verification
- Command access control per role

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- WhatsApp account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Josiasange37/AbyssFlow-Bot.git
cd AbyssFlow-Bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the bot**
```bash
node abyssflow.js
```

5. **Scan QR code**
- Open WhatsApp on your phone
- Go to Settings → Linked Devices
- Scan the QR code displayed in the terminal

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Bot Configuration
SESSION_ID=abyssflow
NODE_ENV=production

# Owner Numbers (comma-separated)
OWNER_NUMBERS=237681752094,237621708081,235893092790367

# Optional: Custom Prefix
COMMAND_PREFIX=*
```

---

## 📦 Deployment

### Deploy on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Click the button above or go to [Railway](https://railway.app/)
2. Connect your GitHub account
3. Select this repository
4. Add environment variables:
   - `OWNER_NUMBERS`: Your WhatsApp numbers
   - `SESSION_ID`: Unique session identifier
5. Deploy and check logs for QR code

### Deploy on Heroku

```bash
heroku create abyssflow-bot
heroku config:set OWNER_NUMBERS="237681752094,237621708081"
git push heroku main
heroku ps:scale worker=1
heroku logs --tail
```

### Deploy on VPS

```bash
# Install PM2
npm install -g pm2

# Start the bot
pm2 start abyssflow.js --name "abyssflow-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## 📚 Documentation

- [Commands Reference](COMMANDS.md)
- [Admin Commands Guide](ADMIN_COMMANDS.md)
- [GroupInfo Command](docs/GROUPINFO_COMMAND.md)
- [TagAll Command](docs/TAGALL_COMMAND.md)
- [GitHub Command](docs/GITHUB_COMMAND.md)
- [Kick Command](docs/KICK_COMMAND.md)
- [Add Command](docs/ADD_COMMAND.md)
- [Quoted Replies](docs/QUOTED_REPLIES.md)
- [Fix Connection Conflicts](docs/FIX_CONNECTION_CONFLICT.md)

---

## 🎨 Creator Profile

**Josias Almight** - Water Hashira

- 🌐 **Website**: [Xyber Clan](https://xyber-clan.vercel.app/)
- 💼 **Portfolio**: [almightportfolio.vercel.app](https://almightportfolio.vercel.app/)
- 💻 **GitHub**: [@Josiasange37](https://github.com/Josiasange37)
- 💼 **LinkedIn**: [thealmight](https://www.linkedin.com/in/thealmight)
- 🐦 **Twitter**: [@AlmightJosias](https://twitter.com/AlmightJosias)
- 📧 **Email**: contact@almight.tech

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This bot is for educational purposes only. Use it responsibly and respect WhatsApp's Terms of Service. The developers are not responsible for any misuse of this bot.

---

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Node.js](https://nodejs.org/) - JavaScript runtime
- All contributors and supporters

---

<div align="center">

**Made with 💧 by Josias Almight - Water Hashira**

⭐ Star this repository if you find it helpful!

</div>
