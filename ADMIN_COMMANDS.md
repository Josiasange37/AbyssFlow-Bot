# 🛡️ Commandes Administrateur - AbyssFlow

## 🔐 Système de Permissions

### Qui Peut Utiliser les Commandes Admin?

1. **Créateur du Bot** (Josias Almight)
   - Accès à TOUTES les commandes
   - Peut utiliser les commandes dans tous les groupes
   - Défini dans `.env` via `BOT_OWNERS`

2. **Administrateurs de Groupe**
   - Accès aux commandes de gestion de groupe
   - Uniquement dans leur groupe
   - Détecté automatiquement par WhatsApp

## 💧 Commandes de Gestion de Groupe

### `*welcome` - Messages de Bienvenue

Configure les messages automatiques pour les nouveaux membres.

**Sous-commandes:**

#### Voir le Statut
```
*welcome
*welcome status
```
Affiche la configuration actuelle (activé/désactivé + message).

#### Activer
```
*welcome on
```
Active les messages de bienvenue automatiques.

#### Désactiver
```
*welcome off
```
Désactive les messages de bienvenue.

#### Définir le Message
```
*welcome set Bienvenue @user dans notre groupe! 🌊
```
Personnalise le message de bienvenue.

**Variables Disponibles:**
- `@user` - Mention automatique du nouveau membre

**Exemples de Messages:**
```
🌊 Bienvenue @user dans le groupe!

💧 Que la force du Water Hashira soit avec toi!
```

```
👋 Salut @user!

Bienvenue dans notre communauté. N'hésite pas à te présenter! 😊
```

---

### `*goodbye` - Messages d'Au Revoir

Configure les messages automatiques quand quelqu'un quitte le groupe.

**Sous-commandes:**

#### Voir le Statut
```
*goodbye
*goodbye status
```
Affiche la configuration actuelle.

#### Activer
```
*goodbye on
```
Active les messages d'au revoir automatiques.

#### Désactiver
```
*goodbye off
```
Désactive les messages d'au revoir.

#### Définir le Message
```
*goodbye set Au revoir @user, bonne continuation! 👋
```
Personnalise le message d'au revoir.

**Variables Disponibles:**
- `@user` - Mention du membre qui est parti

**Exemples de Messages:**
```
👋 @user a quitté le groupe.

🌊 Que ton chemin soit paisible comme l'eau calme.
```

```
Au revoir @user! 

On espère te revoir bientôt. 💙
```

---

### `*kick` (alias: `*remove`) - Expulser des Membres

Expulse des membres du groupe. Le bot doit être admin pour utiliser cette commande.

**Syntaxe:**
```
*kick @user1 @user2 ...
*remove @user
```

**Exemples:**
```
*kick @237681752094
```
Expulse un seul membre.

```
*remove @user1 @user2 @user3
```
Expulse plusieurs membres en une fois.

**Fonctionnalités:**
- ✅ Expulsion simple ou multiple
- ✅ Protection automatique des admins
- ✅ Confirmation avec liste des membres expulsés
- ⚠️ **Le bot DOIT être admin du groupe**

**Messages de Réponse:**

**Succès:**
```
✅ Membres expulsés avec succès!

👥 2 membre(s) expulsé(s):
• @237681752094
• @237621708081

🌊 Action effectuée par le Water Hashira
```

**Bot pas admin:**
```
❌ Le bot doit être admin du groupe pour expulser des membres!
```

**Tentative d'expulsion d'admin:**
```
⚠️ Impossible d'expulser les admins!

1 admin(s) protégé(s)

💡 Révoquez d'abord leurs privilèges admin
```

**Aucune mention:**
```
❌ Aucun membre mentionné!

💡 Utilisation:
`*kick @user1 @user2 ...`

Exemples:
• `*kick @user` - Expulser un membre
• `*remove @user1 @user2` - Expulser plusieurs

⚠️ Note: Mentionnez les membres à expulser
```

**Sécurité:**
- Le bot ne peut pas expulser les admins
- Vérification automatique des permissions
- Logs détaillés de chaque expulsion

---

### `*add` (alias: `*invite`) - Ajouter des Membres

Ajoute des membres au groupe en utilisant leurs numéros de téléphone.

**Syntaxe:**
```
*add 237XXXXXXXXX 237YYYYYYYYY ...
*invite 237XXXXXXXXX
```

**Exemples:**
```
*add 237681752094
```
Ajoute un seul membre.

```
*invite 237681752094 237621708081 235893092790367
```
Ajoute plusieurs membres en une fois.

**Fonctionnalités:**
- ✅ Ajout simple ou multiple
- ✅ Validation automatique des numéros
- ✅ Détection des doublons (déjà membres)
- ✅ Nettoyage automatique (espaces, tirets, etc.)
- ✅ Rapport détaillé des succès et échecs
- ⚠️ **Le bot DOIT être admin du groupe** (recommandé)

**Format des Numéros:**
```
237681752094          ✅ Recommandé
+237681752094         ✅ Accepté
237-681-752-094       ✅ Accepté
237 681 752 094       ✅ Accepté
```

**Messages de Réponse:**

**Succès:**
```
✅ Membres ajoutés avec succès!

👥 2 membre(s) ajouté(s):
• @237681752094
• @237621708081

🌊 Action effectuée par le Water Hashira
```

**Déjà membres:**
```
ℹ️ Déjà membres du groupe:
• @237681752094
```

**Échec partiel:**
```
⚠️ Échec d'ajout pour certains membres:

• @237999999999 (Code: 404)

Raisons possibles:
• Numéro invalide ou inexistant
• Paramètres de confidentialité
• Membre a bloqué le bot
• Membre a quitté récemment
```

**Numéros invalides:**
```
⚠️ Numéros invalides ignorés:
• +237-681-752-094
• abc237681752094

Utilise uniquement des chiffres (ex: 237681752094)
```

**Sécurité:**
- Validation automatique des numéros
- Détection des doublons
- Logs détaillés de chaque ajout
- Codes d'erreur explicites

**Codes d'Erreur:**
- 200: Succès
- 403: Paramètres de confidentialité
- 404: Numéro invalide/inexistant
- 409: Membre vient de quitter (attendez)

---

### `*tagall` (alias: `*mentionall`, `*everyone`) - Mentionner Tous les Membres

Mentionne tous les membres du groupe avec un message personnalisé.

**Syntaxe:**
```
*tagall [message personnalisé]
*mentionall [message]
*everyone [message]
```

**Exemples:**
```
*tagall
```
Envoie une annonce par défaut.

```
*tagall Réunion importante à 15h aujourd'hui!
```
Envoie un message personnalisé.

```
*everyone 🚨 URGENT: Le groupe sera fermé dans 1h!
```
Utilise un alias avec message urgent.

**Fonctionnalités:**
- ✅ Mentionne tous les membres du groupe
- ✅ Message personnalisé ou annonce par défaut
- ✅ Affiche le nombre total de membres
- ✅ Notification pour tous les membres
- 🔐 **Réservé aux admins et créateur**

**Messages de Réponse:**

**Annonce par défaut:**
```
📢 Annonce Importante!

👥 Membres mentionnés:
@237681752094 @237621708081 @235893092790367

📊 Total: 3 membre(s)

🌊 Message envoyé par le Water Hashira
```

**Message personnalisé:**
```
Réunion importante à 15h aujourd'hui!

👥 Membres mentionnés:
@237681752094 @237621708081 @235893092790367

📊 Total: 3 membre(s)

🌊 Message envoyé par le Water Hashira
```

**Cas d'Usage:**
- 📢 Annonces importantes
- 📅 Réunions et événements
- 🚨 Urgences
- 📊 Sondages
- ⏰ Rappels
- 🎉 Célébrations

**Bonnes Pratiques:**
- ✅ Utilisez pour les annonces importantes uniquement
- ✅ Soyez concis et clair
- ✅ Utilisez des emojis pour attirer l'attention
- ❌ N'abusez pas (respectez les membres)
- ❌ Évitez le spam

**Sécurité:**
- Réservé aux admins et créateur
- Logs de toutes les utilisations
- Soumis au rate limit global

---

## 📊 Stockage des Données

Les paramètres de chaque groupe sont sauvegardés dans:
```
/data/groups.json
```

**Structure:**
```json
{
  "groups": {
    "120363XXXXXX@g.us": {
      "welcome": {
        "enabled": true,
        "message": "🌊 Bienvenue @user!"
      },
      "goodbye": {
        "enabled": false,
        "message": "👋 @user est parti"
      }
    }
  }
}
```

---

## 🔒 Sécurité

### Vérifications Automatiques

1. **Vérification du Type de Chat**
   - Les commandes admin fonctionnent uniquement dans les groupes
   - Message d'erreur si utilisé en privé

2. **Vérification des Permissions**
   - Vérifie si l'utilisateur est le créateur OU admin du groupe
   - Message d'erreur si permissions insuffisantes

3. **Validation des Données**
   - Vérifie que les messages ne sont pas vides
   - Sauvegarde automatique après chaque modification

---

## 💡 Conseils d'Utilisation

### Messages de Bienvenue

✅ **Bonnes Pratiques:**
- Soyez accueillant et chaleureux
- Mentionnez les règles du groupe
- Utilisez des emojis pour rendre le message vivant
- Gardez le message court et clair

❌ **À Éviter:**
- Messages trop longs
- Trop d'informations d'un coup
- Langage agressif ou exclusif

### Messages d'Au Revoir

✅ **Bonnes Pratiques:**
- Restez positif
- Souhaitez bonne chance
- Message court et respectueux

❌ **À Éviter:**
- Messages négatifs
- Commentaires sur la raison du départ
- Trop d'émotions

---

## 🚀 Exemples de Configuration Complète

### Groupe Communautaire
```
*welcome on
*welcome set 👋 Bienvenue @user dans notre communauté!

Présente-toi et n'hésite pas à poser des questions. 💬

*goodbye on
*goodbye set Au revoir @user! À bientôt! 👋
```

### Groupe Professionnel
```
*welcome on
*welcome set Bienvenue @user!

Ce groupe est dédié aux discussions professionnelles. Consultez les règles épinglées. 📌

*goodbye on
*goodbye set @user a quitté le groupe.
```

### Groupe d'Amis
```
*welcome on
*welcome set Yoo @user! 🎉

Bienvenue dans la team! On est contents de t'avoir avec nous! 🔥

*goodbye on
*goodbye set @user nous a quitté... On va te manquer! 😢
```

---

## 🐛 Dépannage

### Les Messages ne S'Envoient Pas

1. Vérifiez que la fonctionnalité est activée (`*welcome on`)
2. Vérifiez que le bot a les permissions dans le groupe
3. Consultez les logs du bot pour les erreurs

### Je Ne Peux Pas Utiliser les Commandes

1. Vérifiez que vous êtes admin du groupe
2. Vérifiez que vous utilisez la commande dans un groupe (pas en privé)
3. Vérifiez que le préfixe est correct (`*` par défaut)

---

## 📝 Notes Importantes

- Les paramètres sont **spécifiques à chaque groupe**
- Les modifications sont **sauvegardées automatiquement**
- Le bot doit être **membre du groupe** pour fonctionner
- Les messages utilisent les **mentions WhatsApp** (@)

---

## 🔮 Commandes à Venir

- `*antilink` - Protection anti-liens
- `*antibot` - Bloquer les autres bots
- `*mute @user` - Mute un membre
- `*kick @user` - Expulser un membre
- `*promote @user` - Promouvoir en admin
- `*demote @user` - Rétrograder un admin
- `*tagall` - Mentionner tous les membres
- `*rules` - Afficher/définir les règles

---

**Créé avec 💧 par Josias Almight - Water Hashira**
