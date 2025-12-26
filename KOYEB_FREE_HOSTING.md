# ☁️ Déploiement Complet sur Koyeb (Gratuit & 24h/24)

Ce guide détaille **absolument tout** pour mettre Psycho Bot en ligne gratuitement. Suis chaque étape scrupuleusement.

## 📋 Pré-requis
1. Un compte [GitHub](https://github.com).
2. Tes clés API (.env) à portée de main.
3. Ton téléphone pour scanner le QR Code.

---

## 🚀 Étape 1 : Préparer ton GitHub
1. Crée un nouveau dépôt (Repository) sur GitHub (nomme-le `Psycho-Bot`).
2. Mets le repo en **Privé** (recommandé pour protéger ton code).
3. Utilise la commande suivante dans ton terminal local pour envoyer le code :
   ```bash
   git add .
   git commit -m "Déploiement Koyeb"
   git push origin main
   ```

---

## 🎡 Étape 2 : Configuration sur Koyeb
1. Inscris-toi sur [Koyeb.com](https://app.koyeb.com).
2. Clique sur **"Create Service"**.
3. Sélectionne **"GitHub"**.
4. Autorise Koyeb à accéder à tes dépôts et sélectionne `Psycho-Bot`.
5. **Type de déploiement** : Choisis **"Dockerfile"**.
6. **Région** : Choisis `Frankfurt` ou `Washington, D.C.` (le plus proche de toi).
7. **Instance** : Choisis le plan **"Nano"** (le seul qui est 100% gratuit).

---

## 🔑 Étape 3 : Variables d'Environnement (VITAL)
C'est ici que l'intelligence du bot se configure. Dans la section **Environment Variables**, ajoute :

| Nom de la Variable | Valeur |
| :--- | :--- |
| `MISTRAL_API_KEY` | Ta clé Mistral |
| `MISTRAL_AGENT_ID` | `ag_019b5b38190670e7a41f56581ab8f052` |
| `GITHUB_TOKEN` | Ton token GitHub |
| `GROQ_API_KEY` | Ta clé Groq |
| `COHERE_API_KEY` | Ta clé Cohere |
| `HF_TOKEN` | Ton token Hugging Face |
| `GEMINI_API_KEY` | Ta clé Gemini |
| `BOT_OWNERS` | Ton numéro (ex: `237...`) |
| `BOT_PREFIX` | `*` (ou ce que tu veux) |
| `MONGO_URI` | Ton URI MongoDB Atlas (optionnel pour mémoire infinie) |
| `SEARCH_API_KEY` | Ta clé SerpApi ou Google Search (optionnel pour .google) |
| `PORT` | `8080` (Obligatoire pour le Health Check) |
| `NODE_ENV` | `production` |

---

## 📱 Étape 4 : Connexion & Logs
1. Clique sur **"Deploy"**.
2. Une fois que le statut passe à **"Healthy"**, clique sur l'onglet **"Logs"**.
3. Attends de voir le **QR Code** s'afficher dans la console.
4. Ouvre WhatsApp sur ton téléphone : **Appareils connectés** > **Connecter un appareil**.
5. Scanne le code affiché sur l'écran de Koyeb.
6. **Bravo !** Le bot est en ligne. Tu peux fermer ton navigateur.

---

## 🛠️ Dépannage (Troubleshooting)

### ❓ Le QR Code ne s'affiche pas
- Vérifie les logs. Si tu vois `Module not found`, c'est qu'il manque une dépendance. Mais avec mon `Dockerfile`, ça devrait être parfait.
- Si le log s'arrête, rafraîchis la page Koyeb.

### ❓ Le bot se déconnecte souvent
- Sur le plan gratuit, Koyeb peut redémarrer ton instance de temps en temps.
- Puisque Psycho Bot utilise un dossier de session local, tu devras peut-être scanner à nouveau si le dossier est effacé.
- **Astuce PRO** : Pour une session 100% permanente, il faudrait utiliser une base de données MongoDB, mais pour commencer, Koyeb gratuit est top !

### ❓ Triggers (Quand est-ce qu'il répond ?)
Le bot est configuré pour répondre UNIQUEMENT :
1. Si on le **tague** (`@PsychoBot`).
2. Si on lui **répond** directement (Reply).
3. Si le mot **"bot"** apparaît dans le message du groupe.
4. En **Message Privé** (DM), il répond toujours.

---
*Guide complet par Josias Almight & AntiGravity.*
