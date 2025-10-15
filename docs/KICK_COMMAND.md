# 👢 Commande Kick - AbyssFlow

## 🎯 Description

La commande `*kick` permet d'expulser des membres d'un groupe WhatsApp. Elle est réservée aux administrateurs du groupe et au créateur du bot.

## 🔐 Permissions Requises

### Pour Utiliser la Commande
- ✅ Être **créateur du bot** (configuré dans `BOT_OWNERS`)
- ✅ OU être **admin du groupe**

### Pour que la Commande Fonctionne
- ⚠️ **Le bot DOIT être admin du groupe**
- ⚠️ Le bot ne peut pas expulser d'autres admins

## 💡 Utilisation

### Syntaxe de Base
```
*kick @user
```

### Alias
```
*remove @user
```

### Exemples

#### Expulser un Seul Membre
```
*kick @237681752094
```

#### Expulser Plusieurs Membres
```
*kick @237681752094 @237621708081
```
ou
```
*remove @user1 @user2 @user3
```

## 📋 Fonctionnalités

### ✅ Protection des Admins
- Le bot refuse automatiquement d'expulser les admins
- Message d'avertissement si vous essayez
- Sécurité pour éviter les accidents

### ✅ Expulsion Multiple
- Mentionnez plusieurs personnes dans une seule commande
- Le bot les expulsera toutes en une fois
- Liste des membres expulsés affichée

### ✅ Vérifications Automatiques
1. **Vérification du groupe** - Commande uniquement dans les groupes
2. **Vérification des permissions** - Créateur ou admin requis
3. **Vérification du bot** - Le bot doit être admin
4. **Protection des admins** - Impossible d'expulser les admins

## 📊 Messages de Réponse

### Succès
```
✅ Membres expulsés avec succès!

👥 2 membre(s) expulsé(s):
• @237681752094
• @237621708081

🌊 Action effectuée par le Water Hashira
```

### Erreurs

#### Aucune Mention
```
❌ Aucun membre mentionné!

💡 Utilisation:
`*kick @user1 @user2 ...`

Exemples:
• `*kick @user` - Expulser un membre
• `*remove @user1 @user2` - Expulser plusieurs

⚠️ Note: Mentionnez les membres à expulser
```

#### Bot Pas Admin
```
❌ Le bot doit être admin du groupe pour expulser des membres!
```

#### Tentative d'Expulsion d'Admin
```
⚠️ Impossible d'expulser les admins!

2 admin(s) protégé(s)

💡 Révoquez d'abord leurs privilèges admin
```

#### Pas de Permissions
```
❌ Seuls le créateur et les admins peuvent utiliser cette commande!
```

#### Pas dans un Groupe
```
❌ Cette commande fonctionne uniquement dans les groupes!
```

## 🔧 Configuration Requise

### 1. Le Bot Doit Être Admin

Pour rendre le bot admin:
1. Ouvrez le groupe WhatsApp
2. Infos du groupe → Participants
3. Trouvez le bot dans la liste
4. Appuyez longuement → "Promouvoir en admin"

### 2. Vous Devez Être Admin ou Créateur

**Option 1: Être Créateur**
- Votre numéro doit être dans `BOT_OWNERS` (.env)

**Option 2: Être Admin du Groupe**
- Vous devez avoir les privilèges admin dans le groupe

## 💡 Cas d'Usage

### Modération de Groupe
```
*kick @spammer
```
Expulse rapidement un spammeur.

### Nettoyage de Groupe
```
*kick @inactif1 @inactif2 @inactif3
```
Retire plusieurs membres inactifs en une fois.

### Gestion des Violations
```
*kick @violateur
```
Expulse quelqu'un qui viole les règles.

## ⚠️ Limitations

### Le Bot Ne Peut Pas:
- ❌ Expulser les admins du groupe
- ❌ Expulser le créateur du groupe
- ❌ Fonctionner si le bot n'est pas admin
- ❌ Être utilisé en conversation privée

### Vous Ne Pouvez Pas:
- ❌ Utiliser la commande si vous n'êtes ni créateur ni admin
- ❌ Expulser quelqu'un d'un groupe où le bot n'est pas membre

## 🛡️ Sécurité

### Mesures de Protection

1. **Vérification des Permissions**
   - Seuls créateur + admins peuvent utiliser
   - Double vérification avant expulsion

2. **Protection des Admins**
   - Impossible d'expulser les admins
   - Évite les accidents et abus

3. **Logs Détaillés**
   ```
   [INFO] Kicked 2 member(s) from 120363XXXXXX@g.us
   ```

4. **Messages Clairs**
   - Confirmation de qui a été expulsé
   - Raisons en cas d'échec

## 🔄 Workflow Complet

```
1. Admin tape: *kick @user
   ↓
2. Bot vérifie: Est-ce un groupe?
   ↓
3. Bot vérifie: L'utilisateur est-il admin/créateur?
   ↓
4. Bot vérifie: Le bot est-il admin?
   ↓
5. Bot vérifie: La cible est-elle admin?
   ↓
6. Bot expulse le membre
   ↓
7. Bot envoie confirmation avec mention
```

## 📝 Exemples Pratiques

### Exemple 1: Expulsion Simple
```
Utilisateur: *kick @237681752094

Bot: ✅ Membres expulsés avec succès!

     👥 1 membre(s) expulsé(s):
     • @237681752094

     🌊 Action effectuée par le Water Hashira
```

### Exemple 2: Expulsion Multiple
```
Utilisateur: *remove @user1 @user2 @user3

Bot: ✅ Membres expulsés avec succès!

     👥 3 membre(s) expulsé(s):
     • @user1
     • @user2
     • @user3

     🌊 Action effectuée par le Water Hashira
```

### Exemple 3: Protection Admin
```
Utilisateur: *kick @admin @user

Bot: ⚠️ Impossible d'expulser les admins!

     1 admin(s) protégé(s)

     💡 Révoquez d'abord leurs privilèges admin

     ✅ Membres expulsés avec succès!

     👥 1 membre(s) expulsé(s):
     • @user

     🌊 Action effectuée par le Water Hashira
```

## 🐛 Dépannage

### "Le bot doit être admin"
**Solution:** Rendez le bot admin du groupe.

### "Seuls le créateur et les admins..."
**Solution:** 
- Vérifiez que vous êtes admin du groupe
- OU ajoutez votre numéro à `BOT_OWNERS`

### "Aucun membre mentionné"
**Solution:** Utilisez @ pour mentionner les membres à expulser.

### La commande ne fait rien
**Vérifications:**
1. Le bot est-il dans le groupe?
2. Le bot est-il admin?
3. Avez-vous les permissions?
4. Avez-vous bien mentionné quelqu'un?

## 📊 Logs

Les expulsions sont enregistrées dans les logs:

```bash
[INFO] Command: kick | Sender: 237681752094@s.whatsapp.net | Owner: true | CanUseAdmin: true
[INFO] Kicked 2 member(s) from 120363362744764310@g.us
```

## 🔮 Commandes Associées

- `*promote` - Promouvoir en admin (à venir)
- `*demote` - Rétrograder un admin (à venir)
- `*mute` - Mute un membre (à venir)
- `*ban` - Bannir définitivement (à venir)

## 📞 Support

Pour plus d'informations:
- Tapez `*help` dans WhatsApp
- Consultez `ADMIN_COMMANDS.md`
- Visitez: https://xyber-clan.vercel.app/

---

**Créé avec 💧 par Josias Almight - Water Hashira**
