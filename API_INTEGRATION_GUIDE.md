# 🔐 API Integration Guide - Payment Required System

## 🎯 Système de Sécurité

### ✅ Protection Complète Implémentée

**L'utilisateur NE PEUT PAS accéder au bot sans:**
1. ✅ Créer un compte
2. ✅ Se connecter
3. ✅ Valider un paiement (plan Gold ou Pro)

---

## 🚀 Démarrage de l'API

### Installation

```bash
cd api
npm install
```

### Lancer le serveur

```bash
npm start
# ou en mode développement
npm run dev
```

Le serveur démarre sur: **http://localhost:3001**

---

## 🔐 Endpoints API

### 1. **Authentification**

#### POST `/api/auth/register`
Créer un nouveau compte (commence toujours en Free)

**Body:**
```json
{
  "name": "Josias Almight",
  "email": "user@example.com",
  "phone": "+237XXXXXXXXX",
  "password": "password123",
  "plan": "free"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890",
    "name": "Josias Almight",
    "email": "user@example.com",
    "plan": "free",
    "hasPayment": false
  }
}
```

#### POST `/api/auth/login`
Se connecter

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890",
    "name": "Josias Almight",
    "email": "user@example.com",
    "plan": "gold",
    "hasPayment": true
  }
}
```

#### GET `/api/auth/me`
Obtenir l'utilisateur actuel

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "1234567890",
  "name": "Josias Almight",
  "email": "user@example.com",
  "phone": "+237XXXXXXXXX",
  "plan": "gold",
  "hasPayment": true,
  "createdAt": "2025-10-17T18:00:00.000Z"
}
```

---

### 2. **Paiement (REQUIS pour accéder au bot)**

#### POST `/api/payment/create`
Créer un paiement et activer un plan

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "plan": "gold",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "1234567890",
    "plan": "gold",
    "amount": 9.99,
    "status": "active",
    "expiresAt": "2025-11-17T18:00:00.000Z"
  }
}
```

#### GET `/api/payment/status`
Vérifier le statut du paiement

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "hasPayment": true,
  "activePayment": {
    "id": "1234567890",
    "plan": "gold",
    "amount": 9.99,
    "status": "active",
    "expiresAt": "2025-11-17T18:00:00.000Z"
  },
  "history": [...]
}
```

---

### 3. **Bot (PROTÉGÉ - Nécessite Paiement)**

#### POST `/api/bot/qr`
Générer un QR Code pour connecter le bot

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "qrCode": "abyssflow://connect?session=1234567890&user=123",
  "sessionId": "1234567890",
  "expiresAt": "2025-10-17T18:05:00.000Z"
}
```

**Response (No Payment - 403):**
```json
{
  "error": "Payment required",
  "message": "You must have an active subscription to access the bot",
  "redirectTo": "/dashboard/upgrade"
}
```

#### POST `/api/bot/connect-phone`
Connecter le bot avec un numéro de téléphone

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "phoneNumber": "+237XXXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "1234567890",
  "message": "Bot connected successfully"
}
```

#### GET `/api/bot/status`
Vérifier le statut de connexion du bot

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "connected": true,
  "session": {
    "id": "1234567890",
    "userId": "123",
    "status": "active",
    "plan": "gold",
    "createdAt": "2025-10-17T18:00:00.000Z"
  }
}
```

#### POST `/api/bot/disconnect`
Déconnecter le bot

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Bot disconnected successfully"
}
```

---

### 4. **Statistiques (PROTÉGÉ)**

#### GET `/api/stats`
Obtenir les statistiques du bot

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "groups": 12,
  "messages": 2456,
  "commands": 156,
  "uptime": "99.9%"
}
```

---

## 🔒 Middleware de Protection

### 1. **verifyToken**
Vérifie que l'utilisateur est authentifié

```javascript
// Vérifie le JWT token
// Si invalide → 401 Unauthorized
```

### 2. **verifyPayment**
Vérifie que l'utilisateur a un paiement actif

```javascript
// Vérifie qu'il existe un paiement:
// - status === 'active'
// - expiresAt > maintenant
// Si non → 403 Forbidden + redirect vers /dashboard/upgrade
```

---

## 📊 Base de Données (JSON)

### Structure des fichiers

```
/data/
  ├── users.json       # Utilisateurs
  ├── sessions.json    # Sessions bot
  └── payments.json    # Paiements
```

### users.json
```json
{
  "users": [
    {
      "id": "1234567890",
      "name": "Josias Almight",
      "email": "user@example.com",
      "phone": "+237XXXXXXXXX",
      "password": "hashed_password",
      "plan": "gold",
      "createdAt": "2025-10-17T18:00:00.000Z",
      "verified": false,
      "hasPayment": true
    }
  ]
}
```

### sessions.json
```json
{
  "sessions": [
    {
      "id": "1234567890",
      "userId": "123",
      "qrCode": "abyssflow://connect?session=...",
      "status": "active",
      "plan": "gold",
      "createdAt": "2025-10-17T18:00:00.000Z",
      "expiresAt": "2025-10-17T18:05:00.000Z"
    }
  ]
}
```

### payments.json
```json
{
  "payments": [
    {
      "id": "1234567890",
      "userId": "123",
      "plan": "gold",
      "amount": 9.99,
      "currency": "USD",
      "status": "active",
      "paymentMethod": "card",
      "createdAt": "2025-10-17T18:00:00.000Z",
      "expiresAt": "2025-11-17T18:00:00.000Z"
    }
  ]
}
```

---

## 🎯 Flux Utilisateur

### 1. Inscription
```
User → POST /api/auth/register
     → Compte créé (plan: free, hasPayment: false)
     → Token JWT généré
     → Redirect vers /dashboard/upgrade
```

### 2. Paiement
```
User → POST /api/payment/create (plan: gold)
     → Paiement créé (status: active)
     → User.plan = gold
     → User.hasPayment = true
     → Redirect vers /dashboard
```

### 3. Connexion Bot
```
User → POST /api/bot/qr
     → verifyToken() ✅
     → verifyPayment() ✅
     → QR Code généré
     → Session créée
```

### 4. Tentative sans paiement
```
User (Free) → POST /api/bot/qr
            → verifyToken() ✅
            → verifyPayment() ❌
            → 403 Forbidden
            → Redirect vers /dashboard/upgrade
```

---

## 🚫 Restrictions par Plan

### Free Plan
- ❌ **Pas d'accès au bot**
- ❌ Pas de QR Code
- ❌ Pas de connexion
- ✅ Peut voir le dashboard
- ✅ Peut upgrader

### Gold Plan ($9.99/mois)
- ✅ **Accès au bot**
- ✅ QR Code
- ✅ Connexion
- ✅ 5 groupes max
- ✅ 500 messages/jour

### Pro Plan ($24.99/mois)
- ✅ **Accès complet au bot**
- ✅ QR Code
- ✅ Connexion
- ✅ Groupes illimités
- ✅ Messages illimités
- ✅ API Access

---

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` dans `/api`:

```env
API_PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

---

## 🧪 Tests

### Test 1: Inscription sans paiement
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Résultat:** Compte créé, plan = free, hasPayment = false

### Test 2: Tentative d'accès au bot sans paiement
```bash
curl -X POST http://localhost:3001/api/bot/qr \
  -H "Authorization: Bearer <token>"
```

**Résultat:** 403 Forbidden - Payment required

### Test 3: Créer un paiement
```bash
curl -X POST http://localhost:3001/api/payment/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "gold",
    "paymentMethod": "card"
  }'
```

**Résultat:** Paiement créé, plan = gold, hasPayment = true

### Test 4: Accès au bot avec paiement
```bash
curl -X POST http://localhost:3001/api/bot/qr \
  -H "Authorization: Bearer <token>"
```

**Résultat:** QR Code généré ✅

---

## ✅ Résumé de la Protection

### Ce qui est protégé:
1. ✅ **QR Code** - Nécessite paiement
2. ✅ **Connexion téléphone** - Nécessite paiement
3. ✅ **Statistiques** - Nécessite paiement
4. ✅ **Toutes les fonctions du bot** - Nécessite paiement

### Ce qui est accessible sans paiement:
- ✅ Inscription
- ✅ Connexion
- ✅ Voir le dashboard (limité)
- ✅ Page upgrade
- ✅ Documentation

---

## 🚀 Prochaines Étapes

### Pour la production:
1. [ ] Hasher les mots de passe (bcrypt)
2. [ ] Intégrer Stripe/PayPal
3. [ ] Base de données PostgreSQL
4. [ ] Webhooks pour paiements
5. [ ] Emails de confirmation
6. [ ] Gestion des abonnements récurrents

---

Made with 💙 by Water Hashira
