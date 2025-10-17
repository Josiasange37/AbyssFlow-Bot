# 🚂 Variables d'Environnement Railway

## 📋 Variables Requises pour Railway

Pour que toutes les commandes fonctionnent (notamment `*git`, `*about`, `*links`), ajoutez ces variables sur Railway:

### 1. Configuration du Bot

```
BOT_OWNERS=218966710554635,235893092790367,237681752094,237621708081
BOT_PREFIX=*
SESSION_PATH=./session
NODE_ENV=production
```

### 2. Informations du Créateur

```
CREATOR_NAME=Josias Almight
CREATOR_BIO=Water Hashira - Full Stack Developer & Tech Innovator
CREATOR_TAGLINE=Building the future with code and creativity 💧
CREATOR_LOCATION=Cameroon
CREATOR_SKILLS=JavaScript, Node.js, React, Python, WhatsApp Bots
```

### 3. Liens Sociaux

```
CREATOR_LINKEDIN=https://www.linkedin.com/in/thealmight
CREATOR_GITHUB=https://github.com/Josiasange37
CREATOR_GITHUB_USERNAME=Josiasange37
CREATOR_GITHUB_BIO=Passionate developer creating innovative solutions
CREATOR_PORTFOLIO=https://almightportfolio.vercel.app/
CREATOR_X=https://twitter.com/AlmightJosias
CREATOR_TWITTER=https://twitter.com/AlmightJosias
CREATOR_TIKTOK=@almight.tech
```

### 4. Startup & Contact

```
CREATOR_STARTUP=Xyber Clan
CREATOR_STARTUP_URL=https://xyber-clan.vercel.app/
STARTUP_DESCRIPTION=Innovative tech solutions and digital transformation
CONTACT_EMAIL=contact@almight.tech
```

## 🌐 Comment Ajouter sur Railway

### Méthode Rapide (Copier-Coller)

1. Allez sur [Railway Dashboard](https://railway.app/dashboard)
2. Ouvrez votre projet **AbyssFlow-Bot**
3. Cliquez sur l'onglet **"Variables"**
4. Cliquez sur **"Raw Editor"** (en haut à droite)
5. Collez tout ce bloc:

```
BOT_OWNERS=218966710554635,235893092790367,237681752094,237621708081
BOT_PREFIX=*
SESSION_PATH=./session
NODE_ENV=production
CREATOR_NAME=Josias Almight
CREATOR_BIO=Water Hashira - Full Stack Developer & Tech Innovator
CREATOR_TAGLINE=Building the future with code and creativity 💧
CREATOR_LOCATION=Cameroon
CREATOR_SKILLS=JavaScript, Node.js, React, Python, WhatsApp Bots
CREATOR_LINKEDIN=https://www.linkedin.com/in/thealmight
CREATOR_GITHUB=https://github.com/Josiasange37
CREATOR_GITHUB_USERNAME=Josiasange37
CREATOR_GITHUB_BIO=Passionate developer creating innovative solutions
CREATOR_PORTFOLIO=https://almightportfolio.vercel.app/
CREATOR_X=https://twitter.com/AlmightJosias
CREATOR_TWITTER=https://twitter.com/AlmightJosias
CREATOR_TIKTOK=@almight.tech
CREATOR_STARTUP=Xyber Clan
CREATOR_STARTUP_URL=https://xyber-clan.vercel.app/
STARTUP_DESCRIPTION=Innovative tech solutions and digital transformation
CONTACT_EMAIL=contact@almight.tech
```

6. Cliquez sur **"Update Variables"**
7. Railway redémarre automatiquement

### Méthode Manuelle (Une par Une)

Pour chaque variable:
1. Cliquez sur **"+ New Variable"**
2. Entrez le **nom** (ex: `CREATOR_GITHUB_USERNAME`)
3. Entrez la **valeur** (ex: `Josiasange37`)
4. Cliquez sur **"Add"**

## ✅ Vérification

Après avoir ajouté les variables, vérifiez dans les logs Railway:

```
[INFO] Owners: 218966710554635, 235893092790367, 237681752094, 237621708081
```

## 🧪 Tester les Commandes

Une fois configuré, testez ces commandes sur WhatsApp:

### `*git` - Profil GitHub du Créateur
```
*git
```
**Résultat attendu:**
- Photo de profil GitHub
- Nom, bio, statistiques
- Lien vers le profil

### `*about` - À Propos du Créateur
```
*about
```
**Résultat attendu:**
- Bannière Water Hashira
- Informations complètes
- Compétences et localisation

### `*links` - Liens Sociaux
```
*links
```
**Résultat attendu:**
- Tous les liens sociaux
- Portfolio, LinkedIn, GitHub, etc.

### `*github <username>` - Recherche GitHub
```
*github torvalds
```
**Résultat attendu:**
- Profil de l'utilisateur recherché

## 🔧 Dépannage

### Problème: `*git` ne fonctionne pas

**Vérifiez:**
1. `CREATOR_GITHUB_USERNAME` est défini
2. Le username GitHub est correct
3. Le profil GitHub est public

**Solution:**
Ajoutez/vérifiez la variable:
```
CREATOR_GITHUB_USERNAME=Josiasange37
```

### Problème: `*about` affiche "Unknown"

**Vérifiez:**
1. `CREATOR_NAME` est défini
2. Les autres variables créateur sont présentes

**Solution:**
Ajoutez toutes les variables créateur listées ci-dessus.

### Problème: `*links` ne montre pas tous les liens

**Vérifiez:**
Toutes les variables de liens sociaux sont définies.

**Solution:**
Ajoutez les variables manquantes.

## 📱 Variables Minimales (Si Limité)

Si vous voulez juste que ça fonctionne:

```
BOT_OWNERS=218966710554635,235893092790367
CREATOR_GITHUB_USERNAME=Josiasange37
CREATOR_NAME=Josias Almight
```

## 🎯 Variables Complètes (Recommandé)

Pour une expérience complète, ajoutez TOUTES les variables listées au début de ce document.

## 💡 Astuce

Gardez une copie de vos variables dans un fichier texte sécurisé pour pouvoir les réutiliser facilement si vous redéployez.

---

**Créé avec 💧 par Josias Almight - Water Hashira**
