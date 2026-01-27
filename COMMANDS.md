# 💧 Liste des Commandes

## 📋 Commandes Publiques

### `*help` (aliases: `*menu`, `*commands`)
Affiche le menu d'aide complet avec toutes les commandes disponibles.
- **Bannière**: `help-banner.jpg/png`
- **Accès**: Tous les utilisateurs
- **Exemple**: `*help`

### `*ping`
Vérifie la latence et le temps de réponse du bot.
- **Affiche**: Latence, uptime, statut utilisateur
- **Accès**: Tous les utilisateurs
- **Exemple**: `*ping`

### `*about`
Affiche le profil complet du créateur avec informations professionnelles.
- **Bannière**: `about-banner.jpg/png`
- **Contenu**: Nom, bio, startup, compétences, uptime
- **Accès**: Tous les utilisateurs
- **Exemple**: `*about`

### `*links`
Affiche tous les liens de réseaux sociaux et contacts professionnels.
- **Bannière**: `links-banner.jpg/png`
- **Contenu**: LinkedIn, GitHub, Portfolio, X/Twitter, TikTok, Email, Startup
- **Accès**: Tous les utilisateurs
- **Exemple**: `*links`

### `*git`
Affiche votre profil GitHub avec statistiques.
- **Accès**: Tous les utilisateurs
- **Exemple**: `*git`

### `*github <username>`
Recherche et affiche le profil de n'importe quel utilisateur GitHub.
- **Accès**: Tous les utilisateurs
- **Syntaxe**: `*github <username>`
- **Exemples**: 
  - `*github torvalds` - Profil de Linus Torvalds
  - `*github github` - Profil officiel GitHub
  - `*github Josiasange37` - Profil d'un utilisateur
- **Affiche**: Photo, bio, stats (repos, followers, following), localisation, site web, date d'inscription
- **Note**: Utilise l'API publique GitHub

---

## 🎨 Commandes Multimédia (Tools)

### `*status` (aliases: `statusdown`, `saver`)
Télécharge un statut WhatsApp (Photo/Vidéo).
- **Usage**: Répondez au statut avec `*status`.
- **Accès**: Tous les utilisateurs

### `*pp` (alias: `profilepic`)
Télécharge la photo de profil (HD) d'un utilisateur.
- **Usage**: `*pp` (en réponse) OU `*pp @user`
- **Accès**: Tous les utilisateurs

### `*sticker` (aliases: `s`, `stick`)
Convertit une image, GIF ou vidéo en sticker.
- **Usage**: Répondez au média avec `*sticker`.
- **Accès**: Tous les utilisateurs

### `*tovideo` (aliases: `tomp4`)
Convertit un sticker animé en vidéo MP4.
- **Usage**: Répondez au sticker avec `*tovideo`.
- **Accès**: Tous les utilisateurs

---

## 🛡️ Commandes Admin de Groupe (Créateur + Admins)

### `*kick` (alias: `*remove`)
Expulse des membres du groupe.
- **Accès**: Créateur + Admins du groupe
- **Requis**: Le bot doit être admin
- **Exemple**: `*kick @user1 @user2`
- **Protection**: Ne peut pas expulser les admins

---

## ⚡ Commandes Owner Only

### `*restart`
Redémarre le bot (à implémenter).
- **Accès**: Propriétaires uniquement
- **Exemple**: `*restart`

### `*stats`
Affiche des statistiques détaillées du bot (à implémenter).
- **Accès**: Propriétaires uniquement
- **Exemple**: `*stats`

### `*broadcast <message>`
Envoie un message à tous les utilisateurs (à implémenter).
- **Accès**: Propriétaires uniquement
- **Exemple**: `*broadcast Maintenance prévue ce soir`

### `*eval <code>`
Exécute du code JavaScript (à implémenter).
- **Accès**: Propriétaires uniquement
- **⚠️ Danger**: Utiliser avec précaution
- **Exemple**: `*eval console.log('test')`

### `*extract` (aliases: `vv`)
Extrait un média View Once de manière anonyme.
- **Trigger**: Commande `*extract` (en réponse) OU réaction (⚡, 🔓, ❤️, 😊)
- **Action**: Envoie le média décrypté en DM à l'admin
- **Accès**: Propriétaires uniquement
- **Status**: Incognito 🕵️

---

## 🎨 Système de Bannières

Chaque commande peut avoir une bannière personnalisée:

| Commande | Fichier Bannière | Status |
|----------|------------------|--------|
| `*help` | `help-banner.jpg/png` | ✅ Activé |
| `*about` | `about-banner.jpg/png` | ✅ Activé |
| `*links` | `links-banner.jpg/png` | ✅ Activé |
| `*git` | Avatar GitHub | ✅ Auto |

**Emplacement**: `/assets/banners/`

---

## 🔧 Configuration

- **Préfixe**: `*` (configurable dans `.env`)
- **Rate Limit**: 12 commandes par minute
- **Propriétaires**: Configurés dans `BOT_OWNERS` (.env)

---

## 💡 Conseils d'Utilisation

1. **Commandes sensibles à la casse**: Non, toutes les commandes fonctionnent en minuscules
2. **Aliases**: Certaines commandes ont des alias (ex: help = menu = commands)
3. **Bannières**: Optionnelles, le bot fonctionne sans
4. **Fallback**: Si une bannière échoue, le texte formaté est envoyé

---

---

**Créé par Josias Almight**
