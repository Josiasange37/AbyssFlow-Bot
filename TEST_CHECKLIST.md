# 🧪 Checklist de Tests - AbyssFlow Bot

## ✅ Commandes Publiques

- [ ] **help** - Affiche le menu complet
- [ ] **ping** - Affiche latence et uptime
- [ ] **about** - Affiche profil créateur avec banner
- [ ] **links** - Affiche liens sociaux avec banner
- [ ] **git** - Affiche profil GitHub du créateur
- [ ] **github <username>** - Recherche profil GitHub
- [ ] **whoami** - Affiche JID et permissions
- [ ] **search <query>** - Recherche Google avec lien
- [ ] **privacy** - Affiche politique de confidentialité
- [ ] **disclaimer** - Affiche disclaimer
- [ ] **terms** - Affiche conditions d'utilisation

## ⚠️ Commandes Médias (À TESTER)

- [ ] **sticker** - Convertir image en sticker
  - [ ] Avec image normale
  - [ ] Avec image répondue
  - [ ] Avec vidéo courte (<10s)
  - [ ] Vérifier qualité/lisibilité
  
- [ ] **toimage** - Convertir sticker en image
  - [ ] Avec sticker normal
  - [ ] Avec sticker répondu
  - [ ] Vérifier format PNG/WebP

- [ ] **viewonce** - Extraire vue unique
  - [ ] Avec image vue unique
  - [ ] Avec vidéo vue unique
  - [ ] Avec audio vue unique
  - [ ] Vérifier si déjà vue

## 🛡️ Commandes Admin (À TESTER avec Permissions)

- [ ] **welcome on/off** - Messages de bienvenue
- [ ] **goodbye on/off** - Messages de départ
- [ ] **kick @user** - Expulser membre
- [ ] **add 237XXXXXXXXX** - Ajouter membre
- [ ] **promote @user** - Promouvoir en admin
- [ ] **demote @admin** - Révoquer admin
- [ ] **open** - Ouvrir groupe (tous peuvent écrire)
- [ ] **close** - Fermer groupe (seuls admins)
- [ ] **tagall** - Mentionner tous les membres
- [ ] **groupinfo** - Afficher infos du groupe
- [ ] **antibot on/off** - Protection anti-bot
- [ ] **botstatus** - Statut du bot dans le groupe

## ⚡ Commandes Owner (RISQUE DE BAN)

- [ ] **broadcast <msg>** - Diffusion à tous les groupes
  - ⚠️ TESTER avec 2-3 groupes MAX
  - [ ] Vérifier simulation d'écriture
  - [ ] Vérifier délais aléatoires
  - [ ] Attendre 24h avant re-test
  
- [ ] **stats** - Statistiques détaillées
- [ ] **block @user** - Bloquer utilisateur
- [ ] **unblock @user** - Débloquer utilisateur
- [ ] **join <lien>** - Rejoindre groupe
- [ ] **leave <groupID>** - Quitter groupe

## ❌ Commandes Non Fonctionnelles

- [ ] **db <fichier>** - Téléchargement (EN DÉVELOPPEMENT)
  - Affiche juste un message "En développement"

## 🔍 Tests Spécifiques

### ViewOnce
1. Envoyer image en vue unique
2. Répondre avec `*viewonce`
3. Vérifier extraction

### Sticker
1. Envoyer image normale
2. Caption: `*s`
3. Vérifier qualité du sticker

### Promote/Demote
1. Bot PAS admin
2. Admin du groupe exécute `*promote @user`
3. Vérifier si WhatsApp autorise

### Antibot
1. Activer avec `*antibot on`
2. Faire ajouter un autre bot
3. Vérifier détection et expulsion

### Broadcast
1. TESTER d'abord avec 1-2 groupes
2. Vérifier simulation d'écriture
3. Attendre 24h
4. Re-tester

## 📊 Résultats Attendus

| Commande | Statut | Notes |
|----------|--------|-------|
| help | ✅ | - |
| ping | ✅ | - |
| sticker | ⚠️ | À tester |
| viewonce | ⚠️ | Dépend format WhatsApp |
| promote | ⚠️ | Nécessite permissions |
| antibot | ⚠️ | Détection basique |
| broadcast | ⚠️ | RISQUE DE BAN |
| db | ❌ | Pas implémenté |

## ⚠️ AVERTISSEMENTS

1. **NE PAS** tester broadcast sur tous les groupes d'un coup
2. **NE PAS** utiliser broadcast plus de 2 fois par jour
3. **NE PAS** tester viewonce avec des messages non vue unique
4. **ATTENDRE** 24h entre chaque test de broadcast
5. **VÉRIFIER** les permissions avant promote/demote/kick

## 🚀 Ordre de Test Recommandé

1. Commandes publiques simples (help, ping, about)
2. Commandes médias (sticker, toimage) - 1 à la fois
3. Commandes admin simples (welcome, goodbye)
4. ViewOnce - avec précaution
5. Commandes admin avancées (kick, add) - avec précaution
6. Broadcast - DERNIÈRE priorité, avec EXTRÊME précaution

---

**Date de création:** 17 Oct 2025
**Dernière mise à jour:** À compléter après tests
