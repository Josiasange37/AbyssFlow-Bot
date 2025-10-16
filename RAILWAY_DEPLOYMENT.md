# 🚂 Railway Deployment Guide - AbyssFlow Bot

## 📋 Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Your bot code pushed to GitHub

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up / Login to Railway

1. Go to [Railway.app](https://railway.app/)
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with your **GitHub account**
4. Authorize Railway to access your repositories

### Step 2: Create a New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: **`Josiasange37/AbyssFlow-Bot`**
4. Railway will automatically detect your project

### Step 3: Configure Environment Variables

1. Click on your deployed service
2. Go to the **"Variables"** tab
3. Add the following environment variables:

```env
OWNER_NUMBERS=237681752094,237621708081,235893092790367
SESSION_ID=abyssflow-railway
NODE_ENV=production
```

**To add a variable:**
- Click **"+ New Variable"**
- Enter the **Variable Name** (e.g., `OWNER_NUMBERS`)
- Enter the **Value** (e.g., your phone numbers)
- Click **"Add"**

### Step 4: Deploy the Bot

1. Railway will automatically start deploying
2. Wait for the build to complete (usually 2-5 minutes)
3. Check the **"Deployments"** tab for status

### Step 5: View Logs and Get QR Code

1. Go to the **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Look for the QR code in the logs
5. **Scan the QR code** with WhatsApp:
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices**
   - Tap **"Link a Device"**
   - Scan the QR code from Railway logs

### Step 6: Verify Bot is Running

Once connected, you should see in the logs:
```
[INFO] Bot started successfully
[INFO] ✅ Keep-alive mechanism activated
```

Test the bot by sending `*ping` in WhatsApp!

## 🔧 Configuration Details

### Procfile
Railway uses the `Procfile` to know how to start your bot:
```
worker: node abyssflow.js
```

### railway.json
Configuration file for Railway deployment:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node abyssflow.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Keep-Alive Mechanism
The bot includes a cron job that runs every 5 minutes to keep it active:
```javascript
cron.schedule('*/5 * * * *', () => {
  log.info('🔄 Keep-alive ping - Bot is active');
});
```

## 📊 Railway Free Tier

Railway offers a generous free tier:
- **$5 free credit per month**
- **500 hours of usage**
- **100 GB bandwidth**
- **1 GB RAM per service**

This is more than enough for a WhatsApp bot!

## 🔄 Updating Your Bot

When you make changes to your code:

1. **Commit and push to GitHub:**
```bash
git add .
git commit -m "Update bot features"
git push origin main
```

2. **Railway auto-deploys:**
   - Railway detects the push
   - Automatically rebuilds and redeploys
   - Your bot restarts with new changes

## 📱 Monitoring Your Bot

### View Logs
1. Go to your Railway project
2. Click on your service
3. Go to **"Deployments"** → **"View Logs"**

### Check Metrics
1. Go to **"Metrics"** tab
2. View CPU, Memory, and Network usage

### Restart the Bot
1. Go to **"Settings"**
2. Click **"Restart"** under Service Controls

## 🛠️ Troubleshooting

### Bot Disconnects Frequently
**Problem:** Stream Errored (conflict)
**Solution:** 
- Disconnect all WhatsApp Web sessions
- Go to WhatsApp → Settings → Linked Devices
- Remove all devices
- Redeploy and scan QR code again

### QR Code Not Showing
**Problem:** Can't see QR code in logs
**Solution:**
- Wait 30 seconds after deployment
- Refresh the logs page
- Check if `auth_info_baileys` folder exists

### Bot Not Responding
**Problem:** Commands not working
**Solution:**
- Check logs for errors
- Verify environment variables are set
- Ensure bot is connected (check logs for "Bot started successfully")

### Out of Memory
**Problem:** Bot crashes with memory error
**Solution:**
- Railway free tier has 1GB RAM
- This should be enough for a WhatsApp bot
- If needed, upgrade to Railway Pro

## 🔐 Security Best Practices

### 1. Never Share Your Session
- Don't commit `auth_info_baileys/` folder
- Don't share Railway logs with QR codes
- Keep your session private

### 2. Use Environment Variables
- Store sensitive data in Railway Variables
- Never hardcode phone numbers or tokens
- Use `.env` for local development

### 3. Protect Your Repository
- Keep your repo private if it contains sensitive data
- Use `.gitignore` to exclude session files
- Review commits before pushing

## 📞 Support

### Railway Support
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)

### Bot Issues
- Check [GitHub Issues](https://github.com/Josiasange37/AbyssFlow-Bot/issues)
- Review [Documentation](README.md)
- Contact: contact@almight.tech

## 🎉 Success Checklist

- [ ] Railway account created and connected to GitHub
- [ ] Repository deployed on Railway
- [ ] Environment variables configured
- [ ] Bot deployed successfully
- [ ] QR code scanned with WhatsApp
- [ ] Bot responding to `*ping` command
- [ ] Keep-alive mechanism active
- [ ] Logs showing no errors

## 🚀 Next Steps

Once your bot is deployed:

1. **Test all commands** - Try `*help` to see all available commands
2. **Add to groups** - Invite the bot to your WhatsApp groups
3. **Configure welcome messages** - Use `*welcome` in groups
4. **Monitor logs** - Check Railway logs regularly
5. **Update regularly** - Keep your bot up to date with new features

## 💡 Pro Tips

### Tip 1: Use Railway CLI
Install Railway CLI for easier management:
```bash
npm install -g @railway/cli
railway login
railway link
railway logs
```

### Tip 2: Set Up Notifications
Enable Railway notifications:
- Go to Project Settings
- Enable deployment notifications
- Get notified on Discord/Email

### Tip 3: Monitor Usage
Check your Railway usage:
- Go to Account Settings
- View Usage & Billing
- Track your free credits

### Tip 4: Backup Your Session
Regularly backup your session:
```bash
# Download session from Railway
railway run bash
tar -czf session-backup.tar.gz auth_info_baileys/
# Download the backup
```

## 🌊 Conclusion

Your AbyssFlow bot is now deployed on Railway and running 24/7! 

The bot will:
- ✅ Auto-restart on failures
- ✅ Stay active with keep-alive mechanism
- ✅ Auto-deploy on GitHub pushes
- ✅ Run within Railway's free tier

Enjoy your bot! 🎉

---

**Made with 💧 by Josias Almight - Water Hashira**
