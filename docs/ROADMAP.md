# Roadmap — Invitia

> **Version unique** — Ce document remplace toutes les roadmaps précédentes.

## État actuel : 70%

### ✅ Fonctionnel
- Landing page (8 sections modulaires, responsive)
- Authentification Supabase (signup, login, logout)
- Dark mode (next-themes)
- Page invitation publique `/e/[slug]` (14 composants)
- Dashboard admin invités (CRUD, CSV, WhatsApp, stats)
- Éditeur personnalisation (localStorage)
- 3 événements statiques de démo
- Middleware protection routes
- i18n (installé, à brancher)

### ❌ À finaliser
- Connexion Supabase réelle (manque .env.local configuré)
- Upload d'images (Supabase Storage)
- RSVP connecté à Supabase
- PWA / Service Worker
- Check-in QR code
- Paiement / Plans tarifaires

## Phases

### Phase 3 — Configuration & Polish (1 jour)
- [ ] Créer `.env.local` avec credentials Supabase
- [ ] Exécuter `schema.sql` sur l'instance Supabase
- [ ] Tester auth réelle (signup → login → dashboard)
- [ ] Activer i18n dans l'application
- [ ] Finaliser les 5 templates manquants

### Phase 4 — Features MVP (2 semaines)
- [ ] Upload d'images via Supabase Storage
- [ ] RSVP connecté à Supabase (plus localStorage)
- [ ] Génération liens d'invitation uniques
- [ ] PWA (service worker + manifest)
- [ ] Tests bout en bout

### Phase 5 — SaaS (2 semaines)
- [ ] Paiement (Stripe ou équivalent)
- [ ] Plans tarifaires (Free / Premium)
- [ ] Dashboard super admin
- [ ] Analytics + notifications

### Launch 🚀
- Beta test (20-50 utilisateurs RDC)
- Déploiement Vercel production
- Marketing campaign