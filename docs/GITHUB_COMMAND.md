# 🔍 Commande GitHub - AbyssFlow

## 🎯 Description

La commande `*github` permet de rechercher et afficher le profil de **n'importe quel utilisateur GitHub** avec sa photo de profil, bio, statistiques et informations publiques.

## 💡 Utilisation

### Syntaxe
```
*github <username>
```

### Exemples

#### Rechercher Linus Torvalds
```
*github torvalds
```

#### Rechercher GitHub
```
*github github
```

#### Rechercher un Ami
```
*github Josiasange37
```

## 📊 Informations Affichées

### Photo de Profil
- Avatar GitHub de l'utilisateur
- Envoyé comme image avec caption

### Informations de Base
- 👤 **Nom complet**
- 🔖 **@username**
- 📝 **Bio/Description**
- 🔗 **Lien du profil**

### Statistiques
- 📦 **Repositories publics**
- 👥 **Followers**
- 🤝 **Following**
- 📄 **Gists publics** (si disponible)

### Informations Additionnelles (si disponibles)
- 🏢 **Entreprise**
- 📍 **Localisation**
- 🌍 **Site Web**
- 🐦 **Twitter**
- 📧 **Email**
- 📅 **Date d'inscription**

## 🎨 Exemple de Réponse

### Utilisateur Trouvé
```
[Photo de profil GitHub]

👤 Linus Torvalds
_@torvalds_

📝 Bio:
Creator of Linux and Git

🔗 Profil:
https://github.com/torvalds

📊 Statistiques:
• 📦 Repositories: 4
• 👥 Followers: 180000
• 🤝 Following: 0

📍 Localisation: Portland, OR
🌍 Site Web: https://www.kernel.org

📅 Membre depuis: 13 septembre 2011

🌊 Recherche effectuée par le Water Hashira
```

### Utilisateur Non Trouvé
```
🚫 Utilisateur GitHub introuvable!

❌ L'utilisateur `utilisateurinexistant` n'existe pas sur GitHub.

💡 Vérifiez:
• L'orthographe du nom d'utilisateur
• Que le compte existe bien
• https://github.com/utilisateurinexistant

🌊 Recherche effectuée par le Water Hashira
```

### Nom d'Utilisateur Manquant
```
❌ Nom d'utilisateur GitHub manquant!

💡 Utilisation:
`*github <username>`

Exemples:
• `*github Josiasange37`
• `*github torvalds`
• `*github github`

⚠️ Note: Utilisez le nom d'utilisateur GitHub exact
```

## 🔍 Utilisateurs Populaires à Rechercher

### Créateurs Célèbres
```
*github torvalds          # Linus Torvalds (Linux, Git)
*github gvanrossum        # Guido van Rossum (Python)
*github BrendanEich       # Brendan Eich (JavaScript)
*github dhh               # David Heinemeier Hansson (Ruby on Rails)
```

### Entreprises
```
*github github            # GitHub
*github microsoft         # Microsoft
*github google            # Google
*github facebook          # Meta/Facebook
*github vercel            # Vercel
```

### Projets Open Source
```
*github nodejs            # Node.js
*github reactjs           # React
*github vuejs             # Vue.js
*github angular           # Angular
```

## 🆚 Différence avec `*git`

| Commande | Description | Usage |
|----------|-------------|-------|
| `*git` | Affiche **VOTRE** profil GitHub | `*git` |
| `*github` | Recherche **N'IMPORTE QUEL** utilisateur | `*github <username>` |

### Exemple
```
*git
→ Affiche le profil de Josiasange37 (créateur du bot)

*github torvalds
→ Affiche le profil de Linus Torvalds
```

## 🔧 Fonctionnalités Techniques

### API GitHub
- Utilise l'API publique GitHub
- Pas besoin de token d'authentification
- Limite: 60 requêtes/heure (IP)

### Gestion d'Erreurs
- ✅ Utilisateur non trouvé (404)
- ✅ API indisponible
- ✅ Timeout de connexion
- ✅ Fallback vers texte si image échoue

### Cache
- Pas de cache pour cette commande
- Données toujours fraîches
- Requête API à chaque utilisation

## 📝 Cas d'Usage

### Découvrir un Développeur
```
Vous: Qui est le créateur de Linux?

Ami: Linus Torvalds

Vous: *github torvalds

Bot: [Affiche le profil complet]
```

### Vérifier un Profil
```
Recruteur: Quel est ton GitHub?

Vous: Josiasange37

Recruteur: *github Josiasange37

Bot: [Affiche votre profil avec stats]
```

### Comparer des Profils
```
*github Josiasange37
*github torvalds

Comparez les statistiques!
```

### Inspiration
```
*github github
*github vercel
*github microsoft

Découvrez les profils d'entreprises tech!
```

## 🐛 Dépannage

### "Utilisateur GitHub introuvable"
**Raisons:**
- Nom d'utilisateur incorrect
- Compte supprimé
- Faute de frappe

**Solution:**
- Vérifiez l'orthographe
- Visitez https://github.com/username
- Essayez un autre nom

### "Unable to fetch GitHub profile"
**Raisons:**
- API GitHub indisponible
- Problème de connexion
- Limite de requêtes atteinte

**Solution:**
- Réessayez dans quelques minutes
- Vérifiez votre connexion internet
- Attendez 1 heure si limite atteinte

### Pas de Photo de Profil
**Raison:** L'utilisateur n'a pas d'avatar
**Résultat:** Le bot envoie uniquement le texte

### Informations Manquantes
**Raison:** L'utilisateur n'a pas rempli ces champs
**Résultat:** Ces sections sont omises

## 📊 Statistiques Intéressantes

### Records GitHub
- 👥 **Plus de followers:** torvalds (~180k)
- 📦 **Plus de repos:** freeCodeCamp (~400)
- 🌟 **Projet le plus étoilé:** freeCodeCamp/freeCodeCamp (~400k stars)

### Utilisateurs Notables
```
*github torvalds          # 180k+ followers
*github gvanrossum        # 40k+ followers
*github tj                # 30k+ followers (TJ Holowaychuk)
*github sindresorhus      # 40k+ followers
```

## 🎯 Conseils

### Pour les Développeurs
1. **Partagez votre profil** avec `*github votre_username`
2. **Découvrez des mentors** en recherchant des devs célèbres
3. **Inspirez-vous** des profils d'entreprises

### Pour les Recruteurs
1. **Vérifiez rapidement** les profils des candidats
2. **Comparez les stats** facilement
3. **Partagez des profils** intéressants

### Pour les Curieux
1. **Explorez** les créateurs de vos outils préférés
2. **Découvrez** de nouveaux développeurs
3. **Apprenez** des meilleurs

## 🔗 Liens Utiles

- **API GitHub:** https://api.github.com/users/username
- **GitHub:** https://github.com
- **Documentation API:** https://docs.github.com/en/rest

## 💡 Astuces

### Recherche Rapide
```
*github <username>
```
Une seule commande pour tout savoir!

### Sensible à la Casse
```
*github Josiasange37     ✅ Correct
*github josiasange37     ❌ Peut ne pas fonctionner
```
GitHub est sensible à la casse!

### Nom Exact
```
*github torvalds         ✅ Correct
*github linus torvalds   ❌ Incorrect (espaces)
```
Utilisez uniquement le username, pas le nom complet.

## 🌊 Signature

Chaque profil recherché se termine par:
```
🌊 Recherche effectuée par le Water Hashira
```

Votre bot maintient son identité Water Hashira! 💧

---

**Créé avec 💧 par Josias Almight - Water Hashira**
