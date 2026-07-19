-- Invitia - Script complet (reset + creation)
-- Copiez TOUT ce contenu dans SQL Editor → Run

-- ÉTAPE 1 : Nettoyage complet
DROP TABLE IF EXISTS rsvps CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ÉTAPE 2 : Création des tables
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  event_type TEXT DEFAULT 'wedding',
  event_date TIMESTAMPTZ,
  event_time TEXT,
  location TEXT,
  address TEXT,
  description TEXT,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_settings (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  welcome_message TEXT,
  gate_hint TEXT,
  about_title TEXT,
  main_text TEXT,
  branding JSONB DEFAULT '{}'::jsonb,
  ambiance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  adults INTEGER DEFAULT 0,
  children INTEGER DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'organizer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ÉTAPE 3 : Activer RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;