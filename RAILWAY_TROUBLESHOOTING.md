# 🔧 Railway Deployment Troubleshooting

## ✅ Node.js Version Issue - FIXED

### Problem
```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@whiskeysockets/baileys@6.7.20',
npm warn EBADENGINE   required: { node: '>=20.0.0' },
npm warn EBADENGINE   current: { node: 'v18.20.5', npm: '10.8.2' }
npm warn EBADENGINE }
```

### Solution Applied
We've fixed this by adding:

1. **`.nvmrc` file** - Specifies Node.js 20
2. **`nixpacks.toml`** - Configures Railway to use Node.js 20
3. **`package.json` engines** - Declares Node.js 20+ requirement

Railway will now automatically use Node.js 20 for your deployment.

## 🚀 What Happens Next

After pushing the fix:

1. **Railway auto-detects the changes**
2. **Rebuilds with Node.js 20**
3. **Installs dependencies correctly**
4. **Starts the bot**

## 📊 Monitor the Deployment

### Check Build Logs
1. Go to your Railway project
2. Click on **"Deployments"**
3. Watch the build progress
4. Look for: `Node.js 20.x.x` in the logs

### Verify Successful Build
You should see:
```
✓ Installing dependencies with npm ci
✓ Dependencies installed successfully
✓ Starting application
[INFO] Bot started successfully
[INFO] ✅ Keep-alive mechanism activated
```

## 🔍 Common Issues & Solutions

### Issue 1: Build Still Fails
**Check:** Is the deployment using the latest commit?
**Solution:** 
- Go to Railway dashboard
- Click "Redeploy" to force a fresh build

### Issue 2: QR Code Not Appearing
**Wait Time:** Give it 30-60 seconds after "Bot started successfully"
**Solution:**
- Refresh the logs page
- Look for the QR code ASCII art

### Issue 3: Bot Connects Then Disconnects
**Cause:** Multiple WhatsApp Web sessions
**Solution:**
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Disconnect ALL devices
4. Wait 10 seconds
5. Check Railway logs for new QR code
6. Scan immediately

### Issue 4: "Stream Errored (conflict)"
**Cause:** Another instance is running
**Solution:**
1. Make sure no local instance is running
2. Disconnect all WhatsApp Web sessions
3. Restart the Railway deployment

### Issue 5: Out of Memory
**Symptoms:** Bot crashes with memory errors
**Check:** Railway Metrics tab
**Solution:**
- Railway free tier has 1GB RAM (sufficient for this bot)
- If needed, upgrade to Railway Pro
- Check for memory leaks in logs

## 📱 Testing Your Deployed Bot

Once deployed successfully:

### 1. Find Your Bot Number
Check Railway logs for:
```
[INFO] Session established.
```

### 2. Test Basic Commands
Send these messages to your bot:
```
*ping
*help
*about
```

### 3. Test in a Group
1. Add the bot to a test group
2. Try: `*groupinfo`
3. Try: `*botstatus`

## 🔐 Environment Variables Checklist

Make sure these are set in Railway:

- [ ] `OWNER_NUMBERS` - Your WhatsApp numbers (comma-separated)
- [ ] `SESSION_ID` - Unique identifier (e.g., "abyssflow-railway")
- [ ] `NODE_ENV` - Set to "production"

### How to Add/Edit Variables
1. Go to your Railway project
2. Click on your service
3. Go to **"Variables"** tab
4. Click **"+ New Variable"**
5. Add name and value
6. Railway auto-redeploys

## 📊 Expected Build Output

### Successful Build Sequence:
```
[1/4] Detecting build system
✓ Detected Node.js project

[2/4] Installing Node.js 20.x
✓ Node.js 20.x installed

[3/4] Installing dependencies
✓ npm ci completed

[4/4] Starting application
✓ node abyssflow.js
[INFO] Owners: 237681752094, 237621708081, 235893092790367
[INFO] Socket initialized.
[INFO] Bot started successfully
[INFO] Establishing session...
[QR CODE APPEARS HERE]
```

## 🎯 Success Indicators

Your bot is working when you see:

1. ✅ Build completes without errors
2. ✅ "Bot started successfully" in logs
3. ✅ QR code appears (if first time)
4. ✅ "Session established" message
5. ✅ Bot responds to `*ping` command
6. ✅ Keep-alive logs every 5 minutes

## 🔄 Redeploying After Changes

### Automatic Deployment
Railway auto-deploys when you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Redeploy
1. Go to Railway dashboard
2. Click on your service
3. Go to **"Deployments"**
4. Click **"Redeploy"** on the latest deployment

## 📞 Getting Help

### Railway Support
- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)

### Bot Issues
- [GitHub Issues](https://github.com/Josiasange37/AbyssFlow-Bot/issues)
- Email: contact@almight.tech

## 💡 Pro Tips

### Tip 1: Watch Logs in Real-Time
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Watch logs
railway logs -f
```

### Tip 2: Check Resource Usage
- Go to **"Metrics"** tab
- Monitor CPU, RAM, Network
- Railway free tier: 1GB RAM, 500 hours/month

### Tip 3: Set Up Notifications
- Go to Project Settings
- Enable deployment notifications
- Get alerts on Discord/Email

## 🎉 Deployment Complete!

Once you see:
```
[INFO] ✅ Keep-alive mechanism activated
🔄 Keep-alive ping - Bot is active
```

Your bot is successfully deployed and running 24/7 on Railway! 🚀

---

**Made with 💧 by Josias Almight - Water Hashira**
