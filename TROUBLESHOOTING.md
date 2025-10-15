# 🔧 Dépannage - AbyssFlow

## 🔐 Problèmes de Permissions

### "Je suis créateur mais je ne peux pas utiliser les commandes admin"

**Symptôme:** Vous recevez le message "❌ Seuls le créateur et les admins peuvent utiliser cette commande!"

**Solutions:**

1. **Vérifiez votre numéro dans `.env`**
   ```bash
   BOT_OWNERS=237681752094,237621708081
   ```
   - Assurez-vous que votre numéro est bien listé
   - Format: Sans le `+`, sans espaces
   - Plusieurs numéros séparés par des virgules

2. **Vérifiez les logs**
   ```bash
   node abyssflow.js
   ```
   Cherchez dans les logs:
   ```
   [INFO] Owners: 237681752094, 237621708081
   [INFO] Owner detected: 237681752094 matches 237681752094
   ```

3. **Testez la détection**
   - Envoyez n'importe quelle commande
   - Regardez les logs pour voir:
     ```
     Command: welcome | Sender: 237681752094@s.whatsapp.net | Owner: true | Group: true | GroupAdmin: false | CanUseAdmin: true
     ```

4. **Format du numéro**
   - Votre numéro WhatsApp doit correspondre EXACTEMENT
   - Exemple: Si votre WhatsApp est `+237 681 75 20 94`
   - Dans `.env`: `237681752094` (sans +, sans espaces)

### "Les commandes admin ne fonctionnent pas dans les groupes"

**Vérifications:**

1. **Le bot est-il membre du groupe?**
   - Le bot doit être ajouté au groupe

2. **Utilisez-vous la commande dans un groupe?**
   - Les commandes `*welcome` et `*goodbye` fonctionnent UNIQUEMENT dans les groupes
   - Pas en conversation privée

3. **Le préfixe est-il correct?**
   - Par défaut: `*`
   - Vérifiez dans `.env`: `BOT_PREFIX=*`

---

## 💬 Problèmes de Messages

### "Les messages de bienvenue ne s'envoient pas"

**Checklist:**

1. ✅ La fonctionnalité est activée?
   ```
   *welcome status
   ```
   Doit afficher: `📊 Statut: ✅ Activé`

2. ✅ Le bot a les permissions?
   - Le bot doit être membre du groupe
   - Pas besoin d'être admin

3. ✅ Le message est configuré?
   ```
   *welcome
   ```
   Vérifiez que le message n'est pas vide

4. ✅ Testez en ajoutant quelqu'un
   - Ajoutez un contact au groupe
   - Le message devrait apparaître après 1 seconde

**Si ça ne fonctionne toujours pas:**

Regardez les logs du bot:
```bash
[INFO] Welcome message sent to 237XXXXXXXXX@s.whatsapp.net in 120363XXXXXX@g.us
```

ou

```bash
[ERROR] Failed to send welcome message: [raison]
```

### "Les messages d'au revoir ne s'envoient pas"

Même checklist que pour les messages de bienvenue, mais avec `*goodbye`

---

## 🔄 Problèmes de Connexion

### "Le bot se déconnecte souvent"

**Solutions:**

1. **Vérifiez votre connexion internet**
   - Le bot nécessite une connexion stable

2. **Augmentez les délais de reconnexion**
   Dans `.env`:
   ```
   RECONNECT_BASE_DELAY_MS=3000
   RECONNECT_MAX_DELAY_MS=20000
   ```

3. **Vérifiez les logs**
   ```bash
   [WARN] Connection closed (code 428)
   [WARN] Reconnecting in 2500ms...
   ```

### "QR Code ne s'affiche pas"

**Solutions:**

1. **Supprimez la session**
   ```bash
   rm -rf ./session
   node abyssflow.js
   ```

2. **Vérifiez les permissions**
   ```bash
   chmod -R 755 ./session
   ```

---

## 📊 Problèmes de Données

### "Les paramètres du groupe ne se sauvegardent pas"

**Vérifications:**

1. **Le dossier data existe?**
   ```bash
   ls -la data/
   ```
   Devrait afficher: `groups.json`

2. **Permissions d'écriture?**
   ```bash
   chmod -R 755 data/
   ```

3. **Le fichier est valide?**
   ```bash
   cat data/groups.json
   ```
   Doit être un JSON valide

4. **Regardez les logs**
   ```bash
   [ERROR] Failed to save group settings: [raison]
   ```

### "Réinitialiser les paramètres d'un groupe"

**Méthode 1: Via le fichier**
```bash
nano data/groups.json
```
Supprimez l'entrée du groupe et sauvegardez.

**Méthode 2: Supprimer tout**
```bash
rm data/groups.json
```
Le bot recréera le fichier au prochain démarrage.

---

## 🐛 Problèmes de Commandes

### "La commande ne répond pas"

**Checklist:**

1. ✅ Le préfixe est correct?
   - Par défaut: `*help` (avec astérisque)
   - Pas: `help` ou `/help`

2. ✅ Rate limit atteint?
   - Maximum 12 commandes par minute par utilisateur
   - Attendez 1 minute et réessayez

3. ✅ Le bot est connecté?
   ```bash
   [INFO] Session established.
   ```

4. ✅ La commande existe?
   - Tapez `*help` pour voir toutes les commandes

### "Erreur 'unknown command'"

**Normal si:**
- Vous n'êtes pas propriétaire du bot
- Les utilisateurs normaux ne voient pas ce message

**Si vous êtes propriétaire:**
- Vérifiez l'orthographe de la commande
- Tapez `*help` pour la liste complète

---

## 📝 Logs Utiles

### Activer les logs détaillés

Dans `.env`:
```
LOG_LEVEL=info
```

Options:
- `error` - Seulement les erreurs
- `warn` - Erreurs + avertissements
- `info` - Tout (recommandé pour debug)

### Lire les logs en temps réel

```bash
node abyssflow.js | tee bot.log
```

Cela affiche ET sauvegarde les logs dans `bot.log`

### Logs importants à chercher

**Démarrage:**
```
[INFO] Owners: 237681752094, 237621708081
[INFO] Socket initialized.
[INFO] Session established.
```

**Commandes:**
```
[INFO] Command: welcome | Sender: ... | Owner: true | ...
[INFO] Welcome message sent to ...
```

**Erreurs:**
```
[ERROR] Message handling error: ...
[ERROR] Failed to send welcome message: ...
```

---

## 🆘 Support

### Informations à fournir

Quand vous demandez de l'aide, incluez:

1. **Version de Node.js**
   ```bash
   node --version
   ```

2. **Logs d'erreur**
   - Copiez les dernières lignes d'erreur

3. **Configuration**
   - Votre `.env` (SANS les numéros de téléphone)

4. **Étapes pour reproduire**
   - Qu'avez-vous fait exactement?
   - Quel était le résultat attendu?
   - Quel a été le résultat réel?

### Commandes de diagnostic

```bash
# Vérifier les fichiers
ls -la data/
ls -la session/
ls -la assets/banners/

# Vérifier les permissions
ls -la abyssflow.js

# Tester la connexion
node abyssflow.js

# Vérifier les dépendances
npm list
```

---

## 🔄 Réinitialisation Complète

**⚠️ ATTENTION: Cela supprimera toutes les données!**

```bash
# 1. Arrêter le bot
Ctrl+C

# 2. Supprimer la session
rm -rf ./session

# 3. Supprimer les données
rm -rf ./data

# 4. Réinstaller les dépendances
npm install

# 5. Redémarrer
node abyssflow.js
```

Vous devrez:
- Scanner le QR code à nouveau
- Reconfigurer tous les groupes

---

**Créé avec 💧 par Josias Almight - Water Hashira**
