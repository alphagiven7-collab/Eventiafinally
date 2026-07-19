-- ============================================
-- Invitia - Migration idempotente
-- Executez ce script dans le SQL Editor Supabase
-- ============================================

-- ============================================
-- ÉTAPE 1 : Créer toutes les tables d'abord
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  event_type TEXT DEFAULT 'mariage',
  event_date TIMESTAMPTZ,
  event_time TEXT,
  location TEXT,
  location_lat TEXT,
  location_lng TEXT,
  address TEXT,
  description TEXT,
  cover_image TEXT,
  template_id TEXT,
  is_published BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  admin_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_settings (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  welcome_message TEXT,
  gate_hint TEXT,
  about_title TEXT,
  main_text TEXT,
  program JSONB DEFAULT '[]'::jsonb,
  practical_info JSONB DEFAULT '[]'::jsonb,
  branding JSONB DEFAULT '{}'::jsonb,
  ambiance JSONB DEFAULT '{"musicUrl": "", "volume": 0.35, "enabled": false}'::jsonb,
  sections JSONB DEFAULT '{"guestbook": true, "gallery": true, "countdown": true}'::jsonb,
  links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  group_name TEXT,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  token TEXT UNIQUE NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('confirmed', 'declined')),
  adults INTEGER DEFAULT 0,
  children INTEGER DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'organizer' CHECK (role IN ('organizer', 'super_admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÉTAPE 2 : Supprimer les anciennes policies
-- (les tables existent maintenant)
-- ============================================

DROP POLICY IF EXISTS "Users view own events" ON events;
DROP POLICY IF EXISTS "Users insert own events" ON events;
DROP POLICY IF EXISTS "Users update own events" ON events;
DROP POLICY IF EXISTS "Users delete own events" ON events;
DROP POLICY IF EXISTS "Users manage own event_settings" ON event_settings;
DROP POLICY IF EXISTS "Users manage own guests" ON guests;
DROP POLICY IF EXISTS "Public view guest by token" ON guests;
DROP POLICY IF EXISTS "Users manage own rsvps" ON rsvps;
DROP POLICY IF EXISTS "Users view own profile" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Super admin manage all users" ON users;

-- ============================================
-- ÉTAPE 3 : Recréer les policies
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own events" ON events
  FOR SELECT USING (auth.uid() = user_id OR is_published = true);

CREATE POLICY "Users insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users manage own event_settings" ON event_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = event_settings.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own guests" ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Public view guest by token" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Users manage own rsvps" ON rsvps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Super admin manage all users" ON users
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- ============================================
-- ÉTAPE 4 : Index
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- ÉTAPE 5 : Trigger updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_settings_updated_at ON event_settings;
CREATE TRIGGER update_event_settings_updated_at BEFORE UPDATE ON event_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rsvps_updated_at ON rsvps;
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();