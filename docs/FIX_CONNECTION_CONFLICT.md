# 🔧 Résoudre les Conflits de Connexion

## ❌ Problème

Le bot se déconnecte constamment avec l'erreur:
```
Stream Errored (conflict)
Connection closed (code 440)
```

## 🔍 Cause

**Plusieurs instances** du bot ou de WhatsApp Web essaient de se connecter avec le même compte.

## ✅ Solutions

### Solution 1: Déconnecter les Sessions WhatsApp Web

**Sur votre téléphone:**
1. Ouvrez WhatsApp
2. Allez dans **⚙️ Paramètres**
3. Cliquez sur **"Appareils connectés"**
4. **Déconnectez TOUTES les sessions actives**
5. Attendez 10 secondes
6. Redémarrez le bot

### Solution 2: Tuer les Processus en Double

**Vérifier les processus:**
```bash
ps aux | grep "node abyssflow" | grep -v grep
```

**Tuer tous les processus:**
```bash
pkill -f "node abyssflow"
```

**Attendre 2 secondes puis redémarrer:**
```bash
node abyssflow.js
```

### Solution 3: Utiliser le Script de Redémarrage

**Utilisez le script automatique:**
```bash
./restart.sh
```

Ce script:
1. Arrête toutes les instances existantes
2. Attend 2 secondes
3. Redémarre le bot proprement

## 🛡️ Prévention

### Toujours Arrêter Proprement

**Au lieu de Ctrl+C plusieurs fois, utilisez:**
```bash
./restart.sh
```

### Vérifier Avant de Démarrer

```bash
# Vérifier si le bot tourne déjà
ps aux | grep "node abyssflow" | grep -v grep

# Si oui, tuer d'abord
pkill -f "node abyssflow"

# Attendre puis démarrer
sleep 2
node abyssflow.js
```

### Une Seule Session à la Fois

**Règle importante:**
- ❌ Ne pas ouvrir plusieurs terminaux avec le bot
- ❌ Ne pas avoir WhatsApp Web ouvert en même temps
- ✅ Une seule instance du bot à la fois

## 📋 Checklist de Dépannage

Avant de démarrer le bot:

- [ ] Vérifier qu'aucune instance ne tourne
- [ ] Déconnecter toutes les sessions WhatsApp Web
- [ ] Attendre 10 secondes
- [ ] Démarrer le bot
- [ ] Vérifier qu'il se connecte (pas d'erreur 440)

## 🔄 Workflow Recommandé

### Démarrage Normal
```bash
./restart.sh
```

### Démarrage Manuel
```bash
# 1. Arrêter les instances
pkill -f "node abyssflow"

# 2. Attendre
sleep 2

# 3. Démarrer
node abyssflow.js
```

## ⚠️ Erreurs Courantes

### "Stream Errored (conflict)"
**Cause:** Plusieurs sessions actives
**Solution:** Déconnectez toutes les sessions WhatsApp Web

### "Connection closed (code 440)"
**Cause:** Conflit de session
**Solution:** Tuez tous les processus et redémarrez

### Le bot se reconnecte en boucle
**Cause:** Instance fantôme qui tourne
**Solution:** `pkill -f "node abyssflow"` puis redémarrer

## 💡 Astuces

### Vérifier le Statut
```bash
ps aux | grep "node abyssflow" | grep -v grep
```

### Compter les Instances
```bash
ps aux | grep "node abyssflow" | grep -v grep | wc -l
```
Résultat attendu: **0** (avant démarrage) ou **1** (après démarrage)

### Logs en Temps Réel
```bash
node abyssflow.js 2>&1 | tee bot.log
```

## 🚀 Script de Démarrage Propre

Créez `start.sh`:
```bash
#!/bin/bash

# Arrêter les instances existantes
echo "🛑 Arrêt des instances existantes..."
pkill -f "node abyssflow"
sleep 2

# Vérifier qu'il n'y a plus de processus
COUNT=$(ps aux | grep "node abyssflow" | grep -v grep | wc -l)
if [ $COUNT -gt 0 ]; then
    echo "❌ Des processus tournent encore!"
    exit 1
fi

echo "✅ Aucune instance en cours"
echo "🚀 Démarrage du bot..."
node abyssflow.js
```

## 📞 Support

Si le problème persiste:
1. Déconnectez TOUTES les sessions WhatsApp Web
2. Redémarrez votre téléphone
3. Attendez 5 minutes
4. Redémarrez le bot

---

**Créé avec 💧 par Josias Almight - Water Hashira**
