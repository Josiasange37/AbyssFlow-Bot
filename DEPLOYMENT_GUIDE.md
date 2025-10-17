# 🚀 Guide de Déploiement AbyssFlow Bot

## Méthodes de Déploiement

### 🎯 Méthode 1: Git Push (PLUS SIMPLE - RECOMMANDÉE)

Puisque Railway est déjà connecté à GitHub:

```bash
# 1. Commit tes changements
git add .
git commit -m "Update bot"

# 2. Push vers GitHub
git push origin main

# 3. Railway redéploie automatiquement! ✅
```

**Avantages:**
- ✅ Automatique
- ✅ Pas besoin de CLI
- ✅ Historique Git
- ✅ Rollback facile

---

### 🛠️ Méthode 2: Railway CLI

#### Installation

**Linux/Mac:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

**Ou avec npm:**
```bash
npm install -g @railway/cli
```

**Windows:**
```powershell
iwr https://railway.app/install.ps1 | iex
```

#### Utilisation

```bash
# 1. Se connecter
railway login

# 2. Lier le projet
cd /home/josias/Pictures/Camera/AbyssFlow
railway link

# 3. Sélectionner "courageous-clarity"

# 4. Déployer
railway up

# 5. Voir les logs
railway logs

# 6. Ouvrir le dashboard
railway open
```

**Commandes Utiles:**
```bash
railway status          # Voir le statut
railway logs -f         # Logs en temps réel
railway variables       # Voir les variables
railway run npm start   # Tester localement avec les vars Railway
```

---

### 🐳 Méthode 3: Docker (Avancé)

#### Build Local

```bash
# Build l'image
docker build -t abyssflow-bot .

# Run localement
docker run --env-file .env abyssflow-bot

# Test
docker run -it abyssflow-bot npm test
```

#### Deploy sur Railway avec Docker

Railway détecte automatiquement le `Dockerfile` et l'utilise!

---

## 📋 Checklist Avant Déploiement

- [ ] Variables d'environnement configurées sur Railway
- [ ] `BOT_OWNERS` contient ton numéro
- [ ] `SESSION_PATH=./auth_info_baileys`
- [ ] Volume créé (si disponible)
- [ ] `.gitignore` exclut `auth_info_baileys/`
- [ ] `package.json` a le bon `start` script

---

## 🔧 Configuration Railway

### Variables Requises

```env
BOT_OWNERS=218966710554635,235893092790367,237681752094,237621708081
BOT_PREFIX=*
SESSION_PATH=./auth_info_baileys
NODE_ENV=production
CREATOR_NAME=Josias Almight
CREATOR_GITHUB_USERNAME=Josiasange37
CONTACT_EMAIL=contact@almight.tech
```

### Volume (Si Disponible)

**Mount Path:** `/app/auth_info_baileys`

Cela permet de garder la session WhatsApp entre les redémarrages.

---

## 🐛 Dépannage

### Problème: Bot ne démarre pas

**Solution:**
```bash
# Voir les logs
railway logs

# Vérifier les variables
railway variables

# Redéployer
railway up --detach
```

### Problème: QR Code ne s'affiche pas

**Solution:**
- Attends 20-30 secondes
- Vérifie les logs: `railway logs -f`
- Le QR code apparaît dans les logs

### Problème: Session perdue après redémarrage

**Solution:**
- Crée un volume sur Railway
- Ou upgrade vers Pro Plan
- Ou utilise une base de données externe

### Problème: Commandes ne fonctionnent pas

**Solution:**
- Vérifie `BOT_OWNERS` contient ton numéro
- Format: `237681752094` (sans @s.whatsapp.net)
- Redémarre le bot

---

## 📊 Monitoring

### Logs en Temps Réel

```bash
railway logs -f
```

### Métriques

Dashboard Railway → Metrics:
- CPU Usage
- Memory Usage
- Network Traffic

### Health Check

Le bot a un keep-alive automatique toutes les 5 minutes.

---

## 🔄 Workflow Recommandé

### Développement Local

```bash
# 1. Développer localement
npm run dev

# 2. Tester
npm test

# 3. Commit
git add .
git commit -m "Add new feature"
```

### Déploiement Production

```bash
# 1. Push vers GitHub
git push origin main

# 2. Railway détecte et déploie automatiquement

# 3. Vérifier les logs
railway logs -f

# 4. Tester dans WhatsApp
*ping
*help
```

---

## 🎉 Déploiement Réussi!

Après déploiement, tu devrais voir:

```
✅ Connected successfully
🌊 AbyssFlow Bot is ready!
✅ Keep-alive mechanism activated
```

### Tester le Bot

Dans WhatsApp:
```
*help       → Menu complet
*ping       → Test de latence
*about      → Profil du créateur
*stats      → Statistiques (owner)
```

---

## 📞 Support

- **GitHub:** https://github.com/Josiasange37/AbyssFlow-Bot
- **Email:** contact@almight.tech
- **Railway Docs:** https://docs.railway.app

---

🌊 **AbyssFlow Bot - Water Hashira** 💧
