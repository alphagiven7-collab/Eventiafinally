# Plan de Migration des Fonctionnalités
## Objectif : Faire de Invitia une version complète avec toutes les fonctionnalités de `invitation de mariages`

---

## 📊 État actuel

### Invitia (Next.js) - Déjà en place
- ✅ Landing page moderne (mobile-first, design premium)
- ✅ Création d'événement (formulaire 4 étapes)
- ✅ Sélection de templates (5 modèles)
- ✅ Sauvegarde brouillon (localStorage)
- ✅ Partage WhatsApp
- ✅ Architecture SaaS (Next.js 16 + TypeScript + Supabase)

### invitation de mariages (HTML) - Fonctionnalités éprouvées
- ✅ Page invitation publique (avec gate d'accueil, RSVP, QR code)
- ✅ Admin invités (CRUD, CSV, WhatsApp, stats)
- ✅ Personnalisation complète (textes, photos, couleurs, date, musique)
- ✅ Check-in jour J (scan QR)
- ✅ PWA + Dark mode + Multilingue
- ✅ Compte à rebours
- ✅ Galerie photos + Livre d'or
- ✅ Programme du jour + Carte Google Maps
- ✅ Export calendrier .ics

---

## 🎯 Plan de migration - Priorisation par valeur utilisateur

### PHASE 1 : Fonctionnalités CORE (haute priorité)
**Durée estimée : 2 semaines**

Ces fonctionnalités sont essentielles pour que Invitia soit utilisable en production.

#### 1.1 Page Invitation Publique (`src/app/e/[slug]/page.tsx`)
**Depuis :** `pages/invitation.html` (1304 lignes)

**Composants à créer :**
```
src/components/invitation/
├── GuestGate.tsx           # Porte d'accueil (nom → déverrouillage)
├── InvitationHero.tsx      # Header avec image de fond + titre
├── InvitationCard.tsx      # Carte d'invitation principale
├── RsvpButton.tsx          # Bouton RSVP avec modal
├── CountdownTimer.tsx      # Compte à rebours vers la date
├── ProgramTimeline.tsx     # Timeline du programme
├── VenueMap.tsx            # Carte Google Maps
├── PracticalInfo.tsx       # Infos pratiques (parking, hébergement)
├── DressCode.tsx           # Code vestimentaire avec palette couleurs
├── PhotoGallery.tsx        # Galerie photos + marquee
├── GuestBook.tsx           # Livre d'or (messages invités)
├── MusicPlayer.tsx         # Lecteur musique ambiante
└── AboutModal.tsx          # Modale "À propos de nous"
```

**Logique à migrer :**
- Gate d'accueil (nom invité → sauvegarde localStorage → affichage personnalisé)
- Countdown timer (calcul jours/heures/minutes vers eventDate)
- RSVP form (nom, email, téléphone, nombre adultes/enfants, message)
- QR code génération (pour les liens invités)
- Musique ambiante (play/pause, volume, loop)
- Galerie photos (grid + marquee automatique)
- Livre d'or (affichage + soumission messages)
- Google Maps embed (lat/lng + marqueur)
- Export .ics (génération fichier calendrier)

#### 1.2 Dashboard Admin Invités (`src/app/dashboard/page.tsx`)
**Depuis :** `pages/admin.html` (281 lignes)

**Composants à créer :**
```
src/components/admin/
├── AdminLayout.tsx         # Layout admin (sidebar + header)
├── StatsCards.tsx          # Statistiques (total, confirmés, refus, en attente)
├── GuestTable.tsx          # Liste invités avec recherche/filtres
├── GuestForm.tsx           # Formulaire ajout/édition invité
├── CsvImporter.tsx         # Import CSV
├── WhatsAppSender.tsx      # Envoi messages WhatsApp
├── RsvpTracker.tsx         # Suivi RSVP en temps réel
├── PresenceTracker.tsx     # Suivi présence jour J
└── ExportButtons.tsx       # Export CSV/Excel
```

**Logique à migrer :**
- CRUD invités (create, read, update, delete)
- Import CSV (parsing + insertion batch)
- Génération liens uniques (`?guest=slug&t=token`)
- Template WhatsApp avec variables {nom}, {lien}
- Filtres et recherche (par nom, statut, groupe)
- Stats en temps réel (React Query / Supabase subscriptions)

#### 1.3 Éditeur de Personnalisation (`src/app/create/[id]/edit/page.tsx`)
**Depuis :** `pages/personnalisation.html` (408 lignes)

**Sections à créer :**
```
/src/app/create/[id]/edit/
├── page.tsx                # Page principale avec sidebar
├── components/
│   ├── TextEditor.tsx      # Édition textes (titre, sous-titre, messages)
│   ├── ImageUploader.tsx   # Upload photos (welcome, hero, gallery)
│   ├── ColorPicker.tsx     # Sélection couleurs (primary, accent)
│   ├── DatePicker.tsx      # Date + heure événement
│   ├── ProgramBuilder.tsx  # CRUD programme du jour
│   ├── PracticalInfoEditor.tsx # Édition infos pratiques
│   ├── MusicUploader.tsx   # Upload musique ambiante
│   └── LivePreview.tsx     # Aperçu en temps réel
```

**Logique à migrer :**
- Édition de tous les champs texte (titre, sous-titre, messages)
- Upload images (welcomeImage, heroImage, galerie)
- Sélection couleurs (primaryColor, accentColor)
- Configuration date/heure + countdown
- CRUD programme (ajout/suppression items)
- Upload musique (fichier audio + volume)
- Sauvegarde automatique cloud (Supabase event_settings)
- Aperçu live (rafraîchi en temps réel)

---

### PHASE 2 : Fonctionnalités AVANCÉES (moyenne priorité)
**Durée estimée : 1 semaine**

#### 2.1 Check-in Jour J (`src/app/checkin/page.tsx`)
**Depuis :** `pages/checkin.html` (55 lignes + JS)

**Composants à créer :**
```
src/components/checkin/
├── QRScanner.tsx           # Scan QR code (html5-qrcode)
├── ManualTokenInput.tsx    # Saisie manuelle token
├── CheckinResult.tsx       # Affichage résultat (succès/erreur)
└── PresenceLog.tsx         # Historique des entrées
```

**Logique à migrer :**
- Scan QR (bibliothèque `html5-qrcode`)
- Saisie manuelle token
- Vérification token dans Supabase
- Enregistrement présence (timestamp + staff name)
- Affichage résultat (nom invité, statut, table)

#### 2.2 PWA & Offline Mode
**Fichiers à copier :**
```
public/
├── sw.js                   # Service worker ( Migration: copier directly )
├── manifest.json           # PWA manifest ( copier directly )
└── icons/                  # Icônes PWA ( copier depuis assets/images/ )
```

**Améliorations Next.js :**
- Utiliser `next-pwa` plugin
- Configurer Workbox pour precaching
- Ajouter install prompt personnalisé

#### 2.3 Dark Mode
**Depuis :** `pages/invitation.html` (script dark mode)

**Implémentation Next.js :**
- Toggle dans `src/components/ThemeToggle.tsx`
- Persistance localStorage
- Détection `prefers-color-scheme`
- Appliquer dans `src/app/layout.tsx`

#### 2.4 Multilingue
**Depuis :** `pages/invitation.html` (objet I18n)

**Implémentation Next.js :**
- Installer `next-intl` ou `react-i18next`
- Créer `src/locales/fr.json`, `en.json`
- Wrapper app avec `NextIntlProvider`

---

### PHASE 3 : Fonctionnalités SAAS (pour scaling)
**Durée estimée : 2 semaines**

#### 3.1 Auth & Isolation Multi-tenant
**Nouveau :** À créer from scratch

**Fichiers :**
```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login (email + password)
│   │   ├── signup/page.tsx         # Inscription
│   │   └── callback/route.ts       # Callback Supabase Auth
│   ├── dashboard/page.tsx          # Liste événements de l'utilisateur
│   └── events/[id]/page.tsx        # Détail événement
│
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       └── ProtectedRoute.tsx      # HOC pour protéger les routes
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client Supabase (déjà présent)
│   │   ├── auth.ts                 # Helpers auth
│   │   └── rls-policies.sql        # RLS policies (voir plus bas)
│   └── utils/
│       ├── authorization.ts         # Vérification droits d'accès
│       └── event-slug.ts            # Génération slug unique
│
└── types/
    └── index.ts                     # Types User, Event, Guest, RSVP
```

**RLS Policies Supabase :**
```sql
-- Organisation : voir seulement ses événements
CREATE POLICY "Users view own events" ON events
  FOR SELECT USING (user_id = auth.uid());

-- Organisation : modifier seulement ses événements
CREATE POLICY "Users update own events" ON events
  FOR UPDATE USING (user_id = auth.uid());

-- Organisation : voir seulement ses invités
CREATE POLICY "Users view own guests" ON guests
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- Super admin : voit tout
CREATE POLICY "Super admin sees all" ON events
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );
```

#### 3.2 Dashboard Super Admin
**Nouveau :** À créer from scratch

**Fichiers :**
```
src/app/admin/
├── page.tsx                # Vue globale (tous événements)
├── components/
│   ├── PlatformStats.tsx   # Stats globales
│   ├── EventList.tsx       # Liste tous événements
│   ├── UserList.tsx        # Liste tous organisateurs
│   ├── ValidationQueue.tsx # File de validation événements
│   └── QuotasManager.tsx   # Gestion quotas par plan
```

---

## 📦 Assets & Données à copier

### Fichiers statiques (copie directe)
```
Z:\projets\invitation de mariages\assets\
├── images/                 →  Invitia\public\images\
├── css/
│   ├── app.css             →  Invitia\src\app\globals.css (adapter)
│   ├── admin.css           →  Invitia\src\components\admin\admin.css
│   └── personnalisation.css → Invitia\src\components\create\edit\personnalisation.css
└── js/
    ├── supabase-config.js  →  Invitia\src\lib\supabase\config.ts
    └── (autres JS → réécrire en React)

Z:\projets\invitation de mariages\events\
├── yanick-keren.json       →  Invitia\src\data\events\yanick-keren.json
├── anniversaire-grace.json →  Invitia\src\data\events\anniversaire-grace.json
└── conference-tech-2026.json → Invitia\src\data\events\conference-tech-2026.json

Z:\projets\invitation de mariages\data\
└── guests-exemple.csv      →  Invitia\src\data\guests-exemple.csv
```

### Migration Supabase
- Les tables existantes dans Supabase peuvent être réutilisées
- Ajouter colonne `user_id` dans table `events`
- Créer table `users` (si pas déjà fait)
- Configurer RLS policies (voir plus haut)

---

## 🚀 Ordre d'implémentation recommandé

### Semaine 1 : Page Invitation (core)
1. Créer types TypeScript (Event, Guest, RSVP, EventSettings)
2. Créer composants invitation (Gate, Hero, Card, RSVP, Countdown, Gallery, Music)
3. Créer route `src/app/e/[slug]/page.tsx`
4. Copier événements JSON dans `src/data/events/`
5. Connecter Supabase (requêtes événements, RSVP)
6. Tester avec événement Yanick & Keren

### Semaine 2 : Admin + Personnalisation
1. Créer `src/app/dashboard/page.tsx` (admin invités)
2. Créer composants admin (GuestTable, CsvImporter, WhatsAppSender)
3. CRUD invités (Supabase)
4. Créer `src/app/create/[id]/edit/page.tsx` (personnalisation)
5. Implémenter édition + sauvegarde Supabase
6. Tester création événement de A à Z

### Semaine 3 : Check-in + PWA + Dark mode
1. Créer `src/app/checkin/page.tsx` (scan QR)
2. Implémenter PWA (next-pwa + sw.js)
3. Implémenter dark mode toggle
4. Implémenter multilingue (i18n)

### Semaine 4 : Auth + SaaS
1. Installer Supabase Auth
2. Créer pages signup/login
3. Créer dashboard organisateur (liste ses événements)
4. Implémenter RLS policies
5. Tester isolation multi-tenant
6. Créer super admin dashboard

### Semaine 5 : Polish + Deploy
1. Tests bout en bout
2. Corriger bugs
3. Optimiser performances
4. Déployer sur Vercel
5. Migrer données de invitation de mariages vers Supabase

---

## 📋 Checklist des fonctionnalités à implémenter

### Invitation Publique
- [ ] Gate d'accueil (nom → personnalisation)
- [ ] Hero section avec image de fond
- [ ] Carte d'invitation (design floral/glass morphism)
- [ ] Compte à rebours
- [ ] Bouton RSVP (ouvre formulaire)
- [ ] Programme du jour (timeline)
- [ ] Carte Google Maps (embed)
- [ ] Infos pratiques (parking, hébergement)
- [ ] Code vestimentaire (palette couleurs)
- [ ] Galerie photos (grid + marquee)
- [ ] Livre d'or (messages)
- [ ] Musique ambiante (play/pause)
- [ ] Section "À propos" (modale)
- [ ] Export calendrier .ics
- [ ] Partage WhatsApp
- [ ] Dark mode
- [ ] Multilingue (FR/EN)

### Admin Invités
- [ ] Liste invités (table avec recherche/filtres)
- [ ] Ajout manuel invité
- [ ] Import CSV
- [ ] Édition invité
- [ ] Suppression invité
- [ ] Génération lien unique
- [ ] Template WhatsApp
- [ ] Envoi WhatsApp
- [ ] Stats (total, confirmés, refus, en attente)
- [ ] Suivi RSVP temps réel
- [ ] Export CSV

### Personnalisation
- [ ] Édition textes (titre, sous-titre, messages)
- [ ] Upload photos (welcome, hero, galerie)
- [ ] Sélection couleurs (primary, accent)
- [ ] Date + heure événement
- [ ] Compte à rebours (activer/désactiver)
- [ ] Lieu + adresse + GPS
- [ ] Carte Google Maps
- [ ] Programme du jour (CRUD items)
- [ ] Infos pratiques (CRUD items)
- [ ] Code vestimentaire (titre + couleurs)
- [ ] Section "À propos" (texte + image)
- [ ] Musique ambiante (upload + volume)
- [ ] Sections (activer/désactiver : guestbook, gallery, etc.)
- [ ] Aperçu live
- [ ] Sauvegarde cloud (Supabase)

### Check-in
- [ ] Scan QR code
- [ ] Saisie manuelle token
- [ ] Vérification token
- [ ] Enregistrement présence
- [ ] Affichage résultat
- [ ] Historique entrées

### Auth & SaaS
- [ ] Inscription organisateur
- [ ] Login organisateur
- [ ] Dashboard organisateur (liste ses événements)
- [ ] Création événement
- [ ] Isolation multi-tenant (RLS)
- [ ] Super admin dashboard
- [ ] Validation événements
- [ ] Quotas par plan

---

## 🎯 Résultat final

Une fois terminé, `invitia` aura :

✅ **Toutes les fonctionnalités de `invitation de mariages`** (invitation, admin, personnalisation, check-in)
✅ **Design moderne mobile-first** (déjà en place)
✅ **Architecture SaaS scalable** (Next.js + Supabase + Auth)
✅ **3 événements réels fonctionnels** (Yanick, Grace, Conférence)
✅ **Multi-tenant sécurisé** (isolation par organisateur)
✅ **Super admin dashboard** (vue globale)

**Prêt à commencer la Phase 1 ?** (Page invitation publique)