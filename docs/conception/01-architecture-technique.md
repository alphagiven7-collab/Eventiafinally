# 🏗️ ARCHITECTURE TECHNIQUE — Invitia

## 1. Stack Technique

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   Next.js 14 (App Router) + TypeScript + Tailwind CSS        │
│   └── React Server Components + Server Actions               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│   Next.js API Routes / Server Actions                        │
│   └── Validation: Zod                                        │
│   └── Auth: NextAuth.js + Supabase Auth                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                          │
│   ├── PostgreSQL (données relationnelles)                    │
│   ├── Auth (authentification)                               │
│   ├── Storage (images)                                      │
│   └── Realtime (RSVP en temps réel)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       EXTERNAL APIS                           │
│   ├── Google Maps Embed API (localisation)                  │
│   ├── WhatsApp API / Deep Links (partage)                   │
│   └── Stripe (paiement futur)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Structure du Projet

```
invitia/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (public)/              # Pages publiques (non connectées)
│   │   │   ├── page.tsx           # Accueil
│   │   │   ├── e/[slug]/          # Page événement publique
│   │   │   └── rsvp/[eventId]/    # Page RSVP
│   │   │
│   │   ├── (dashboard)/           # Espace connecté
│   │   │   ├── layout.tsx         # Layout dashboard
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Tableau de bord
│   │   │   ├── events/
│   │   │   │   ├── new/           # Création événement
│   │   │   │   └── [id]/          # Édition événement
│   │   │   └── settings/          # Paramètres compte
│   │   │
│   │   ├── api/                   # API Routes (si besoin)
│   │   │   └── webhooks/
│   │   │
│   │   ├── auth/                  # Auth NextAuth
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── callback/
│   │   │
│   │   └── layout.tsx             # Root layout
│   │
│   ├── components/
│   │   ├── ui/                    # Composants base (Button, Input, Card...)
│   │   ├── forms/                  # Formulaires (EventForm, GuestForm...)
│   │   ├── templates/             # Modèles d'invitation
│   │   │   ├── WeddingTemplate.tsx
│   │   │   ├── BirthdayTemplate.tsx
│   │   │   └── BabyShowerTemplate.tsx
│   │   ├── dashboard/              # Composants dashboard
│   │   └── public/                 # Composants pages publiques
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Client Supabase
│   │   │   ├── server.ts          # Server Supabase
│   │   │   └── types.ts           # Types générés
│   │   ├── auth.ts                # Config NextAuth
│   │   ├── utils.ts               # Helpers
│   │   └── constants.ts           # Constantes (types d'événements, etc.)
│   │
│   ├── hooks/                     # React Hooks personnalisés
│   ├── types/                     # Types TypeScript globaux
│   └── styles/                    # Styles globaux + Tailwind
│
├── public/
│   ├── templates/                 # Assets templates
│   └── favicon.ico
│
├── supabase/
│   ├── migrations/               # Migrations SQL
│   └── seed.sql                   # Données initiales
│
├── tests/
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

---

## 3. Schéma Base de Données

### 3.1 Diagramme Entité-Relation

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     events      │       │     guests      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (UUID)       │──┐    │ id (UUID)       │──┐    │ id (UUID)       │
│ email           │  │    │ user_id (FK)    │◄─┘    │ event_id (FK)   │◄─┐
│ password_hash   │  │    │ slug (UNIQUE)   │       │ name            │  │
│ full_name       │  └───►│ title           │       │ phone           │  │
│ phone           │       │ event_type      │       │ email           │  │
│ avatar_url      │       │ event_date      │       │ status          │  │
│ created_at      │       │ event_time      │       │ message         │  │
│ updated_at      │       │ location        │       │ created_at      │  │
└─────────────────┘       │ description     │       │ updated_at      │  │
                          │ cover_image     │       └─────────────────┘  │
                          │ template_id     │               │            │
                          │ is_published   │               │            │
                          │ view_count     │               ▼            │
                          │ created_at     │       ┌─────────────────┐  │
                          │ updated_at     │       │      rsvp       │  │
                          └─────────────────┘       ├─────────────────┤  │
                              │                    │ id (UUID)       │  │
                              │                    │ guest_id (FK)   │◄─┘
                              │                    │ event_id (FK)   │◄─┘
                              │                    │ status          │
                              │                    │ note            │
                              │                    │ responded_at    │
                              │                    └─────────────────┘
                              │
                              ▼
                          ┌─────────────────┐
                          │    templates    │
                          ├─────────────────┤
                          │ id (UUID)       │
                          │ name            │
                          │ slug            │
                          │ category        │
                          │ thumbnail_url   │
                          │ layout_config   │ (JSON)
                          │ is_active       │
                          └─────────────────┘
```

### 3.2 Détail des Tables

#### Table `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'birthday', 'baby_shower', 'graduation')),
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  description TEXT,
  cover_image TEXT,
  template_id UUID REFERENCES templates(id),
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table `guests`
```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table `rsvp`
```sql
CREATE TABLE rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending')),
  note TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id)
);
```

#### Table `templates`
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  layout_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API Endpoints (Server Actions)

### 4.1 Authentification

| Action | Type | Paramètres | Retour |
|--------|------|------------|--------|
| `auth.signUp` | Server Action | email, password, fullName | User |
| `auth.signIn` | Server Action | email, password | Session |
| `auth.signOut` | Server Action | - | void |
| `auth.getSession` | Function | - | Session |

### 4.2 Événements

| Action | Type | Paramètres | Retour |
|--------|------|------------|--------|
| `events.create` | Server Action | EventInput | Event |
| `events.update` | Server Action | id, EventInput | Event |
| `events.delete` | Server Action | id | void |
| `events.getById` | Function | id | Event |
| `events.getBySlug` | Function | slug | Event |
| `events.getUserEvents` | Function | userId | Event[] |
| `events.publish` | Server Action | id | Event |
| `events.incrementViews` | Server Action | slug | void |

### 4.3 Invités & RSVP

| Action | Type | Paramètres | Retour |
|--------|------|------------|--------|
| `guests.add` | Server Action | eventId, GuestInput | Guest |
| `guests.addBulk` | Server Action | eventId, GuestInput[] | Guest[] |
| `guests.update` | Server Action | id, GuestInput | Guest |
| `guests.remove` | Server Action | id | void |
| `guests.getByEvent` | Function | eventId | Guest[] |
| `rsvp.respond` | Server Action | eventId, guestId, status, note | RSVP |
| `rsvp.getStats` | Function | eventId | RSVPStats |

### 4.4 Templates

| Action | Type | Paramètres | Retour |
|--------|------|------------|--------|
| `templates.getAll` | Function | category? | Template[] |
| `templates.getById` | Function | id | Template |

---

## 5. Types TypeScript

```typescript
// src/types/index.ts

// === ENUMS ===
export type EventType = 'wedding' | 'birthday' | 'baby_shower' | 'graduation';
export type RSVPStatus = 'pending' | 'confirmed' | 'declined';
export type AttendanceStatus = 'attending' | 'not_attending';

// === USER ===
export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
}

// === EVENT ===
export interface Event {
  id: string;
  userId: string;
  slug: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  eventTime?: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  description?: string;
  coverImage?: string;
  templateId?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventInput {
  title: string;
  eventType: EventType;
  eventDate: string;
  eventTime?: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  description?: string;
  coverImage?: string;
  templateId?: string;
}

// === GUEST ===
export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone?: string;
  email?: string;
  status: RSVPStatus;
  message?: string;
  createdAt: Date;
}

export interface GuestInput {
  name: string;
  phone?: string;
  email?: string;
}

// === RSVP ===
export interface RSVP {
  id: string;
  guestId: string;
  eventId: string;
  status: AttendanceStatus;
  note?: string;
  respondedAt: Date;
}

export interface RSVPStats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
}

// === TEMPLATE ===
export interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  thumbnailUrl?: string;
  layoutConfig: Record<string, any>;
  isActive: boolean;
}

// === SESSION ===
export interface Session {
  user: User;
  expires: string;
}
```

---

## 6. Variables d'Environnement

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. Sécurité

### 7.1 Authentification
- [ ] Hachage bcrypt pour les mots de passe
- [ ] Sessions sécurisées avec HTTP-only cookies
- [ ] Rate limiting sur les endpoints auth
- [ ] Vérification email obligatoire

### 7.2 Autorisation
- [ ] Row Level Security (RLS) sur Supabase
- [ ] Vérification ownership avant modification
- [ ] Validation côté serveur de toutes les entrées

### 7.3 Protection des données
- [ ] HTTPS obligatoire
- [ ] Validation Zod sur tous les formulaires
- [ ] Échappement XSS sur l'affichage
- [ ] Protection CSRF

---

## 8. Performance

### 8.1 Optimisations Frontend
- [ ] Images optimisées (Next.js Image)
- [ ] Lazy loading des composants
- [ ] Server Components par défaut
- [ ] Client Components uniquement si nécessaire

### 8.2 Optimisations Backend
- [ ] Index sur les requêtes fréquentes
- [ ] Pagination pour les listes
- [ ] Mise en cache des templates
- [ ] Compression des réponses API

---

*Document de conception technique — Invitia v1.0*
