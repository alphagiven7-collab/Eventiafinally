-- Invitia - Tables minimales (sans FK, sans DROP POLICY)
-- Copiez-collez ceci dans SQL Editor Supabase et executez

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'wedding',
  event_date TIMESTAMPTZ,
  event_time TEXT,
  location TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'organizer',
  created_at TIMESTAMPTZ DEFAULT now()
);