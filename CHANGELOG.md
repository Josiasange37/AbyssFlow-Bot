# 📝 Changelog - AbyssFlow

## [v1.3.0] - 2025-10-15

### ✨ Nouvelles Fonctionnalités

#### 🎯 Commande Kick
- **Ajout de `*kick` (alias: `*remove`)** - Expulsion de membres du groupe
  - Expulsion simple ou multiple
  - Protection automatique des admins
  - Vérification que le bot est admin
  - Messages de confirmation avec mentions
  - Logs détaillés de chaque expulsion
  
**Utilisation:**
```
*kick @user1 @user2
*remove @user
```

**Sécurité:**
- Le bot ne peut pas expulser les admins
- Vérification des permissions (créateur + admins)
- Messages d'erreur clairs

### 📚 Documentation
- Ajout de `docs/KICK_COMMAND.md` - Documentation complète
- Ajout de `docs/QUICK_KICK_GUIDE.md` - Guide rapide
- Mise à jour de `ADMIN_COMMANDS.md`
- Mise à jour de `COMMANDS.md`
- Mise à jour du menu `*help`

---

## [v1.2.0] - 2025-10-15

### ✨ Nouvelles Fonctionnalités

#### 🔍 Commande Debug
- **Ajout de `*whoami`** - Identifie votre numéro WhatsApp et permissions
  - Affiche le JID complet
  - Affiche le numéro normalisé
  - Affiche tous les statuts (propriétaire, admin, etc.)
  - Instructions pour devenir propriétaire

#### 🔐 Support Multi-Format
- **Support du format @lid** (Linked Device / Business)
  - Format standard: `237681752094@s.whatsapp.net`
  - Format LID: `235893092790367@lid`
  - Matching flexible pour tous les formats
  - Logs détaillés du processus de matching

#### 🛠️ Améliorations
- Logs de debug améliorés pour la détection des propriétaires
- Vérification flexible des numéros (includes, endsWith)
- Messages d'erreur plus clairs
- Ajout de 3 numéros propriétaires: 237681752094, 237621708081, 235893092790367

### 📚 Documentation
- Ajout de `FIND_MY_NUMBER.md` - Guide pour identifier son numéro
- Ajout de `SOLUTION_LID_FORMAT.md` - Solution pour le format @lid
- Ajout de `TROUBLESHOOTING.md` - Guide de dépannage complet
- Ajout de `test-owner.js` - Script de test pour la détection

---

## [v1.1.0] - 2025-10-15

### ✨ Nouvelles Fonctionnalités

#### 💬 Gestion de Groupe
- **Ajout de `*welcome`** - Configuration des messages de bienvenue
  - `*welcome on/off` - Activer/désactiver
  - `*welcome set <message>` - Personnaliser le message
  - `*welcome status` - Voir la configuration
  - Variable `@user` pour mentionner les nouveaux membres

- **Ajout de `*goodbye`** - Configuration des messages d'au revoir
  - `*goodbye on/off` - Activer/désactiver
  - `*goodbye set <message>` - Personnaliser le message
  - `*goodbye status` - Voir la configuration
  - Variable `@user` pour mentionner les membres partis

#### 🔐 Système de Permissions
- Détection automatique des admins de groupe
- Permissions basées sur les rôles:
  - Créateur du bot: Accès total partout
  - Admins de groupe: Accès aux commandes de leur groupe
  - Utilisateurs: Commandes publiques uniquement

#### 💾 Stockage de Données
- Système de sauvegarde des paramètres de groupe
- Fichier `/data/groups.json`
- Configuration indépendante par groupe
- Sauvegarde automatique

#### 🎭 Événements de Groupe
- Détection automatique des nouveaux membres
- Détection automatique des départs
- Messages automatiques avec mentions
- Délais naturels (1 seconde)

### 📚 Documentation
- Ajout de `ADMIN_COMMANDS.md` - Guide complet des commandes admin
- Mise à jour du menu `*help`

---

## [v1.0.0] - 2025-10-15

### ✨ Fonctionnalités Initiales

#### 📱 Commandes Publiques
- `*help` (aliases: `*menu`, `*commands`) - Menu d'aide complet
- `*ping` - Test de latence et uptime
- `*about` - Profil du créateur avec bannière
- `*links` - Liens sociaux avec bannière
- `*git` - Profil GitHub avec stats

#### 🎨 Système de Bannières
- Auto-détection depuis `/assets/banners/`
- Support JPG, PNG, JPEG
- Fallback intelligent vers texte formaté
- Bannières pour help, about, links
- GitHub avatar automatique pour *git

#### 💅 Interface Visuelle
- Codes couleur ANSI
- Thèmes de messages (info, success, warning, error, special)
- Layout avec coins arrondis (╭╮╰╯)
- Design mobile-responsive (38 caractères max)
- Support markdown WhatsApp (*gras*, _italique_)
- Interface riche en emojis

#### 🔒 Sécurité
- Rate limiting (12 commandes/minute)
- Protection anti-spam
- Throttling des requêtes
- Gestion de session
- Authentification des propriétaires

#### 📊 Formatage des Messages
- Word wrapping automatique
- Chunking pour longs messages (1000 caractères)
- Délais dynamiques selon la longueur
- Mises à jour de présence (composing/paused)
- Fallback en cas d'échec

#### 🌊 Personnalité Water Hashira
- Thème cohérent dans tous les messages
- Emojis 💧⚡🌊
- Messages inspirés de l'eau
- Signature professionnelle

### 📚 Documentation
- `README.md` - Documentation principale
- `COMMANDS.md` - Référence des commandes
- `assets/banners/README.md` - Guide des bannières
- `assets/banners/QUICK_START.md` - Démarrage rapide

### ⚙️ Configuration
- Fichier `.env` pour la configuration
- Support multi-propriétaires
- Préfixe personnalisable
- Délais configurables
- Niveaux de logs

---

## 🔮 À Venir

### Commandes Planifiées
- [ ] `*promote @user` - Promouvoir en admin
- [ ] `*demote @user` - Rétrograder un admin
- [ ] `*mute @user` - Mute un membre
- [ ] `*unmute @user` - Unmute un membre
- [ ] `*antilink on/off` - Protection anti-liens
- [ ] `*tagall` - Mentionner tous les membres
- [ ] `*rules` - Afficher/définir les règles
- [ ] `*restart` - Redémarrer le bot
- [ ] `*stats` - Statistiques détaillées
- [ ] `*broadcast` - Message à tous
- [ ] `*eval` - Exécuter du code (owner only)

### Améliorations Planifiées
- [ ] Base de données pour les utilisateurs
- [ ] Système de niveaux/XP
- [ ] Commandes de jeux
- [ ] Intégration IA
- [ ] Traduction automatique
- [ ] Stickers personnalisés
- [ ] Météo en temps réel
- [ ] Citations aléatoires

---

## 📊 Statistiques

### Lignes de Code
- Total: ~1,300 lignes
- JavaScript: ~1,200 lignes
- Documentation: ~2,000 lignes

### Commandes Implémentées
- Publiques: 6 commandes
- Admin Groupe: 3 commandes
- Debug: 1 commande
- Total: 10 commandes

### Documentation
- Fichiers MD: 12 fichiers
- Guides: 5 guides
- Scripts: 1 script de test

---

**Créé avec 💧 par Josias Almight - Water Hashira**
