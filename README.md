# 🎉 Invitia

> Plateforme de création d'invitations numériques pour événements - Mariages, anniversaires, baby showers et plus encore.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Un projet Supabase (gratuit sur [supabase.com](https://supabase.com))

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-repo/invitia.git
cd invitia

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec vos credentials Supabase

# 4. Initialiser la base de données
# Dans Supabase Dashboard > SQL Editor > Exécuter le contenu de:
# supabase/migrations/001_initial.sql

# 5. Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
invitia/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── page.tsx           # Landing page
│   │   ├── create/            # Création d'événement
│   │   ├── e/[slug]/          # Page événement publique
│   │   ├── auth/              # Pages d'authentification
│   │   └── dashboard/         # Tableau de bord
│   │
│   ├── components/
│   │   ├── ui/                # Composants base (Button, Input, Card...)
│   │   ├── forms/             # Formulaires
│   │   ├── templates/         # Modèles d'invitation
│   │   └── public/            # Composants pages publiques
│   │
│   ├── lib/
│   │   ├── supabase/          # Clients Supabase
│   │   ├── utils.ts           # Fonctions utilitaires
│   │   └── constants.ts       # Constantes
│   │
│   ├── types/                 # Types TypeScript
│   └── hooks/                # React hooks personnalisés
│
├── supabase/
│   └── migrations/           # Migrations SQL
│
└── docs/
    └── conception/           # Documents de conception
```

## 🎨 Design System

### Palette de couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Primary | `#1A1A2E` | Textes, backgrounds |
| Gold | `#D4AF37` | Accents, CTAs |
| Cream | `#F8F4F0` | Background principal |
| Sand | `#E8E0D8` | Bordures |
| Earth | `#6B5B4F` | Textes secondaires |

### Typographie

- **Titres**: Playfair Display (serif)
- **Corps**: Inter (sans-serif)

## 🗄️ Base de données

### Tables principales

- `users` - Utilisateurs authentifiés
- `events` - Événements créés
- `guests` - Invités par événement
- `rsvp` - Réponses RSVP
- `templates` - Modèles d'invitation

Voir `supabase/migrations/001_initial.sql` pour le schéma complet.

## 📱 Fonctionnalités MVP

- [x] Création d'événement (5 types)
- [x] Sélection de template (5 modèles)
- [x] Page d'événement publique
- [x] RSVP (confirmations de présence)
- [x] Partage WhatsApp
- [x] Tableau de bord
- [ ] Authentification (en cours)
- [ ] Upload d'images
- [ ] Google Maps integration

## 🔧 Technologies

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes, Supabase
- **Base de données**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth

## 📝 Scripts

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Démarrer en production
npm run lint         # Linting ESLint
```

## 🚀 Déploiement

### Vercel (recommandé)

1. Poussez sur GitHub
2. Importez dans Vercel
3. Configurez les variables d'environnement
4. Déployez !

### Autres hébergeurs

Compatible avec tout hébergeur supportant Next.js (Netlify, Railway, etc.)

## 📄 Licence

MIT © Invitia

---

Créé avec ❤️ en RDC
