# ☁️ Hébergement sur Render (Blueprint)

Render est une excellente alternative à Koyeb. Voici comment déployer Psycho Bot en quelques clics.

## 📋 Étapes

### 1️⃣ Préparer GitHub
- Assure-toi que ton code est à jour sur ton repo GitHub (y compris le fichier `render.yaml`).

### 2️⃣ Créer un compte Render
- Connecte-toi sur [Render.com](https://render.com) avec ton compte GitHub.

### 3️⃣ Déployer via Blueprint
- Clique sur **"New +"** en haut à droite.
- Choisis **"Blueprint"**.
- Sélectionne ton dépôt `AbyssFlow-Bot`.
- Render va lire le fichier `render.yaml` et te demander les valeurs pour tes variables d'environnement.

### 4️⃣ Configurer les Variables
Remplis toutes les clés API (Mistral, Gemini, etc.) que tu as dans ton `.env`. 
> [!IMPORTANT]
> - **MONGO_URI** : Obligatoire pour ne rien perdre au redémarrage.
> - **APP_URL** : Une fois le service créé, Render te donne une URL (ex: `https://psycho-bot.onrender.com`). Copie cette URL et colle-la dans la variable `APP_URL` pour que le script **Anti-Sommeil** garde le bot réveillé 24h/24 !

### 5️⃣ Connexion
- Une fois le service créé, va dans **"Events"** ou **"Logs"**.
- Attends que le bot s'installe et affiche le **QR Code**.
- Scanne-le.

## ⚠️ Notes importantes sur Render
- **Plan Free** : Le bot "s'endort" après 15 minutes d'inactivité. Pour qu'il reste réveillé 24h/24, il faut soit passer en plan payant ($7), soit utiliser un service de "ping" externe (comme Cron-job.org) pour appeler l'URL de ton bot toutes les 10 minutes.
- **Session** : Comme sur Koyeb, la session est perdue au redémarrage sur le plan gratuit. L'utilisation de **MongoDB** (Phase 14) est donc FORTEMENT recommandée pour la persistance.

---
*Guide créé par AntiGravity.*
