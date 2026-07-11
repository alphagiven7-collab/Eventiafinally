# Instructions pour Claude Code

## Projet Invitia

Plateforme de création d'invitations numériques pour événements.

## Stack Technique

- **Framework**: Next.js 16 (App Router)
- **Langage**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Base de données**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: Composants custom (pas shadcn/ui)

## Structure importante

- `src/app/` - Pages Next.js
- `src/components/ui/` - Composants UI de base
- `src/lib/` - Utilities, constants, Supabase clients
- `src/types/` - Types TypeScript
- `supabase/migrations/` - Schéma BDD

## Commandes

- `npm run dev` - Développement
- `npm run build` - Build production
- `npm run lint` - Linting

## Conventions

- Composants: PascalCase
- Fonctions/utilities: camelCase
- Types: TypeScript interfaces
- Couleurs: Variables CSS (primary, gold, cream, etc.)
- Fonts: Playfair Display (titres), Inter (corps)

## Design System

Voir `docs/conception/03-design-system.md`

## Notes

- Ce projet utilise Tailwind v4 avec la syntaxe `@import "tailwindcss"` (pas de tailwind.config.ts)
- Les couleurs sont définies via CSS variables dans `@theme inline`
