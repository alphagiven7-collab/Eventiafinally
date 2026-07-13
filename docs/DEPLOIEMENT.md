# Guide de Déploiement - Phase 4

## ✅ État actuel

- Build Next.js réussi
- Routes configurées
- Auth Supabase intégrée
- RLS policies prêtes

## 🚀 Étapes de déploiement

### 1. Variables d'environnement

Ajouter dans `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
```

### 2. Base de données Supabase

Exécuter dans Supabase SQL Editor :
```sql
-- Table users
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  event_date TIMESTAMP,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table guests
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  token TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. RLS Policies

Exécuter `supabase/rls-policies.sql` dans Supabase.

### 4. Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### 5. Configuration finale

- [ ] Configurer le domaine personnalisé
- [ ] Tester l'inscription/connexion
- [ ] Vérifier les RLS policies
- [ ] Tester la création d'événement
- [ ] Vérifier le dashboard admin