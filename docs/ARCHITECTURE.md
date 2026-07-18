# Architecture — Invitia

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Langage | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| Base de données | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| i18n | i18next + react-i18next |
| Validation | Zod + react-hook-form |
| Icônes | Lucide React |
| Déploiement | Vercel |

## Arborescence

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Styles globaux + design tokens
│   ├── e/[slug]/           # Page invitation publique
│   ├── create/             # Création d'événement
│   ├── dashboard/          # Dashboard organisateur
│   ├── admin/              # Super admin
│   ├── auth/               # Login / Register
│   ├── checkin/            # Check-in QR code
│   └── api/                # API Routes
│
├── components/
│   ├── ui/                 # Design system (Button, Card, Input...)
│   ├── landing/            # Sections landing page
│   ├── invitation/         # Composants invitation publique
│   ├── admin/              # Composants dashboard admin
│   └── auth/               # ProtectedRoute
│
├── providers/              # Providers React
│   ├── auth-provider.tsx   # Auth (Supabase)
│   ├── theme-provider.tsx  # Theme (next-themes)
│   └── theme-toggle.tsx    # Toggle dark mode
│
├── lib/
│   ├── supabase/           # Clients Supabase (browser + server)
│   └── utils.ts            # Utilitaires (cn, formatDate, slug...)
│
├── constants/              # Constantes (EVENT_TYPES, TEMPLATES...)
├── config/                 # Configuration (Supabase ready check)
├── types/                  # Types TypeScript centralisés
├── locales/                # i18n (fr.json, en.json)
└── data/
    └── events.ts           # Événements statiques (hardcoded)
```

## Design Tokens

```css
Primary: #1A1A2E (bleu nuit)
Gold:    #D4AF37 (or)
Cream:   #F8F4F0 (crème)
Sand:    #E8E0D8 (sable)
Earth:   #6B5B4F (terre)

Fonts: Playfair Display (titres), Cormorant Garamond (alt), Inter (corps)
```

## Décisions techniques (ADR)

1. **Supabase Auth** — Choix unique pour l'authentification. Pas de next-auth.
2. **Pas de fallback localStorage** — L'app exige Supabase configuré.
3. **Types centralisés** — Un seul fichier `src/types/index.ts`.
4. **Providers dans `src/providers/`** — Séparation claire.
5. **Composants < 250 lignes** — Extraction systématique.