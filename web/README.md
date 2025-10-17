# 🌊 AbyssFlow Dashboard - Professional WhatsApp Bot Interface

Interface web professionnelle pour gérer votre bot WhatsApp AbyssFlow avec style et efficacité.

## 🎨 Features

### ✅ Pages Complètes

- **Landing Page (/)** - Page d'accueil avec présentation complète
- **Login/Register (/login)** - Authentification par QR Code ou Email/Téléphone
- **Dashboard (/dashboard)** - Tableau de bord avec statistiques en temps réel
- **Commands (/commands)** - Liste détaillée de toutes les commandes
- **About (/about)** - À propos du créateur et de l'équipe
- **Upgrade (/dashboard/upgrade)** - Page de mise à niveau pour les plans payants

### 🔐 Système d'Authentification

- **2 méthodes de connexion:**
  - QR Code WhatsApp (scan direct)
  - Email/Téléphone + Mot de passe
- **Protection des routes** avec middleware
- **Plans utilisateur:** Free, Gold, Pro

### 💎 Plans & Limitations

#### Free Plan
- ❌ 1 groupe maximum
- ❌ 50 messages/jour
- ❌ Pas de broadcast
- ❌ Commandes limitées

#### Gold Plan ($9.99/mois)
- ✅ 5 groupes maximum
- ✅ 500 messages/jour
- ✅ Broadcast (3x/jour)
- ✅ Toutes les commandes
- ✅ Support prioritaire

#### Pro Plan ($24.99/mois)
- ✅ Groupes illimités
- ✅ Messages illimités
- ✅ Broadcast illimité
- ✅ API Access
- ✅ White-label option
- ✅ Support 24/7

## 🚀 Technologies

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **QR Code:** qrcode.react

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build

# Lancer en production
npm start
```

## 🌐 URLs Disponibles

- **http://localhost:3000** - Landing page
- **http://localhost:3000/login** - Login/Register
- **http://localhost:3000/dashboard** - Dashboard (protégé)
- **http://localhost:3000/commands** - Liste des commandes
- **http://localhost:3000/about** - À propos
- **http://localhost:3000/dashboard/upgrade** - Upgrade plan

## 🎨 Design System

### Couleurs

```css
Primary: #1890ff (Bleu)
Secondary: #722ed1 (Violet)
Accent: #faad14 (Or)
Success: #52c41a (Vert)
Error: #f5222d (Rouge)
```

### Animations

- **Float** - Animation de flottement
- **Pulse Slow** - Pulsation lente
- **Shimmer** - Effet de brillance
- **Slide Up** - Glissement vers le haut
- **Fade In** - Apparition en fondu

## 🔒 Sécurité

### Middleware de Protection

Le middleware protège automatiquement:
- Routes `/dashboard/*` - Nécessite authentification
- Routes premium - Nécessite plan Gold ou Pro

### Authentification

```typescript
// Cookies utilisés
- auth-token: Token d'authentification
- user-plan: Plan de l'utilisateur (free/gold/pro)
```

## 📱 Responsive Design

- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Large Desktop (1440px+)

## 🎯 Prochaines Étapes

### Backend API
- [ ] Créer API REST pour le bot
- [ ] WebSocket pour temps réel
- [ ] Base de données (PostgreSQL)
- [ ] Authentification JWT

### Paiement
- [ ] Intégration Stripe
- [ ] Intégration PayPal
- [ ] Support crypto (Bitcoin, Ethereum)

### Features
- [ ] Analytics avancées
- [ ] Logs en temps réel
- [ ] Gestion des groupes
- [ ] Configuration du bot
- [ ] Historique des commandes

## 👨‍💻 Créateur

**Josias Almight**
- GitHub: [@Josiasange37](https://github.com/Josiasange37)
- LinkedIn: [thealmight](https://www.linkedin.com/in/thealmight)
- Portfolio: [almightportfolio.vercel.app](https://almightportfolio.vercel.app/)
- Email: contact@almight.tech

## 🏢 Équipe

**Xyber Clan** - Startup Partenaire
- Website: [xyber-clan.vercel.app](https://xyber-clan.vercel.app/)

## 📄 License

Copyright © 2025 Josias Almight. All rights reserved.

---

Made with 💙 by Water Hashira
