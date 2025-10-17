# 🚀 Quick Start Guide - AbyssFlow

## ⚡ Démarrage Rapide (3 étapes)

### 1️⃣ Installer les dépendances

```bash
# API Backend
cd api
npm install

# Interface Web
cd ../web
npm install

# Bot WhatsApp (racine)
cd ..
npm install
```

### 2️⃣ Lancer les serveurs

**Terminal 1 - API Backend:**
```bash
cd api
npm start
```
✅ API sur: http://localhost:3001

**Terminal 2 - Interface Web:**
```bash
cd web
npm run dev
```
✅ Web sur: http://localhost:3000

**Terminal 3 - Bot WhatsApp:**
```bash
npm start
```
✅ Bot démarre et attend connexion

### 3️⃣ Tester le système

1. **Ouvrir le navigateur:** http://localhost:3000
2. **Créer un compte** (plan Free)
3. **Essayer d'accéder au bot** → ❌ Bloqué
4. **Passer à Gold/Pro** → ✅ Accès débloqué
5. **Générer QR Code** → ✅ Connecter le bot

---

## 🔐 Système de Protection

### ❌ Sans Paiement (Free)
```
User → Clique "Générer QR Code"
     → API vérifie le paiement
     → hasPayment = false
     → 403 Forbidden
     → Redirigé vers /dashboard/upgrade
```

### ✅ Avec Paiement (Gold/Pro)
```
User → Clique "Générer QR Code"
     → API vérifie le paiement
     → hasPayment = true
     → QR Code généré
     → Bot connecté
```

---

## 💳 Simuler un Paiement

### Via l'interface web:
1. Se connecter
2. Aller sur `/dashboard/upgrade`
3. Cliquer "Passer à Gold" ou "Passer à Pro"
4. Paiement simulé automatiquement ✅

### Via API (curl):
```bash
# 1. S'inscrire
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Copier le token de la réponse

# 2. Créer un paiement
curl -X POST http://localhost:3001/api/payment/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "gold",
    "paymentMethod": "card"
  }'

# 3. Générer QR Code
curl -X POST http://localhost:3001/api/bot/qr \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📊 Vérifier que ça Marche

### Test 1: Utilisateur Free (DOIT ÉCHOUER)
```bash
# Créer compte Free
POST /api/auth/register

# Essayer QR Code
POST /api/bot/qr
→ 403 Forbidden ✅
→ "Payment required" ✅
```

### Test 2: Utilisateur Gold (DOIT RÉUSSIR)
```bash
# Créer compte
POST /api/auth/register

# Payer Gold
POST /api/payment/create (plan: gold)

# Générer QR Code
POST /api/bot/qr
→ 200 OK ✅
→ QR Code généré ✅
```

---

## 🎯 URLs Importantes

- **Landing:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard
- **Upgrade:** http://localhost:3000/dashboard/upgrade
- **Commands:** http://localhost:3000/commands
- **About:** http://localhost:3000/about

- **API:** http://localhost:3001
- **API Docs:** Voir API_INTEGRATION_GUIDE.md

---

## 💎 Plans Disponibles

| Plan | Prix | Accès Bot | Groupes | Messages |
|------|------|-----------|---------|----------|
| Free | $0 | ❌ NON | 0 | 0 |
| Gold | $9.99/mois | ✅ OUI | 5 | 500/jour |
| Pro | $24.99/mois | ✅ OUI | ∞ | ∞ |

---

## 🐛 Dépannage

### Problème: API ne démarre pas
```bash
cd api
rm -rf node_modules
npm install
npm start
```

### Problème: Web ne démarre pas
```bash
cd web
rm -rf node_modules .next
npm install
npm run dev
```

### Problème: Bot ne se connecte pas
1. Vérifier que l'API tourne (port 3001)
2. Vérifier que le paiement est actif
3. Vérifier les logs du bot

### Problème: QR Code ne s'affiche pas
1. Vérifier que vous êtes connecté
2. Vérifier que vous avez un plan payant
3. Ouvrir la console du navigateur (F12)

---

## 📚 Documentation Complète

- **FINAL_SUMMARY.md** - Vue d'ensemble complète
- **API_INTEGRATION_GUIDE.md** - Guide API détaillé
- **WEB_DASHBOARD_SUMMARY.md** - Interface web
- **TEST_CHECKLIST.md** - Tests à effectuer

---

## ✅ Checklist de Vérification

Avant de lancer en production:

- [ ] API démarre sans erreur
- [ ] Web démarre sans erreur
- [ ] Bot démarre sans erreur
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Paiement fonctionne
- [ ] QR Code bloqué pour Free
- [ ] QR Code accessible pour Gold/Pro
- [ ] Bot se connecte avec QR Code
- [ ] Commandes du bot fonctionnent

---

## 🎉 C'est Prêt!

**Ton système est maintenant:**
- ✅ Sécurisé (paiement obligatoire)
- ✅ Fonctionnel (50+ commandes)
- ✅ Professionnel (interface moderne)
- ✅ Commercialisable (3 plans)

**Prochaine étape:** Intégrer Stripe pour les vrais paiements!

---

Made with 💙 by Water Hashira
