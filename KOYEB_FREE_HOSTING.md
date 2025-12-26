# ☁️ Hébergement Gratuit sur Koyeb

## 🎯 Objectif
Déployer **Psycho Bot** gratuitement et 24h/24 sans avoir besoin de laisser ton PC allumé.

## 📋 Étapes

### 1️⃣ Précharger ton Code sur GitHub
1. Crée un repo privé (ou public) sur ton GitHub.
2. Push tout le code du bot dedans (avec le `Dockerfile` que j'ai créé).

### 2️⃣ Créer un Compte Koyeb
1. Inscris-toi sur [Koyeb](https://app.koyeb.com/auth/signup). (Pas besoin de carte bancaire pour le plan gratuit).

### 3️⃣ Créer l'App
1. Clique sur **"Create Service"**.
2. Choisis **"GitHub"** comme source.
3. Sélectionne ton repo `AbyssFlow-Bot`.
4. Dans **"Builder"**, choisis **"Dockerfile"**.

### 4️⃣ Configurer les Variables (TRÈS IMPORTANT)
Dans l'onglet **"Variables"**, ajoute toutes celles de ton `.env` :
- `MISTRAL_API_KEY`
- `GITHUB_TOKEN`
- `GROQ_API_KEY`
- `COHERE_API_KEY`
- `HF_TOKEN`
- `GEMINI_API_KEY`
- `BOT_OWNERS` (ton numéro)
- `BOT_PREFIX`
- `PORT` = `8080` (C'est indispensable pour que Koyeb sache que l'app est lancée).

### 5️⃣ Déployer
1. Clique sur **"Deploy"**.
2. Attends 2-3 minutes.
3. Va dans **"Logs"** pour voir le QR Code apparaître.
4. Scanne-le avec ton WhatsApp.

## ⚠️ Note sur la Persistance
Sur le plan **gratuit** de Koyeb (Nano instance), les fichiers sont supprimés à chaque redémarrage.
- **Solution** : Une fois connecté, le bot restera en ligne tant que Koyeb ne le redémarre pas. Si ça redémarre, tu devras peut-être scanner à nouveau si tu n'utilises pas de base de données externe pour la session (comme MongoDB).

## ✅ Avantages
- ✅ Gratuit (0€)
- ✅ Toujours en ligne
- ✅ Facile à mettre à jour via GitHub

---
*Guide créé par AntiGravity pour le Xyber Clan.*
