-- ============================================
-- Invitia - Schéma Supabase (PostgreSQL)
-- ============================================

-- ============================================
-- TABLE: events (Événements créés par les users)
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

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own events" ON events
  FOR SELECT USING (auth.uid() = user_id OR is_published = true);

CREATE POLICY "Users insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TABLE: event_settings (Personnalisation détaillée)
-- ============================================
CREATE TABLE IF NOT EXISTS event_settings (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  identity_revision INTEGER DEFAULT 0,
  welcome_message TEXT,
  gate_hint TEXT,
  invite_intro TEXT,
  invite_secondary TEXT,
  reserve_text TEXT,
  rsvp_deadline_text TEXT,
  rsvp_button_color TEXT,
  meta_description TEXT,
  about_title TEXT,
  main_text TEXT,
  program_section_title TEXT,
  program JSONB DEFAULT '[]'::jsonb,
  practical_section_title TEXT,
  practical_info JSONB DEFAULT '[]'::jsonb,
  rsvp_deadline TIMESTAMPTZ,
  dress_code_title TEXT,
  ambiance JSONB DEFAULT '{"musicUrl": "", "volume": 0.35, "enabled": false}'::jsonb,
  branding JSONB DEFAULT '{}'::jsonb,
  sections JSONB DEFAULT '{"quiz": false, "donation": false, "guestbook": true, "gallery": true, "countdown": true, "dressCode": false}'::jsonb,
  links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own event_settings" ON event_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_settings.event_id
      AND events.user_id = auth.uid()
    )
  );

-- ============================================
-- TABLE: guests (Invités)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own guests" ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Public view guest by token" ON guests
  FOR SELECT USING (true);

-- ============================================
-- TABLE: rsvps (Réponses RSVP)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rsvps" ON rsvps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvps.event_id
      AND events.user_id = auth.uid()
    )
  );

-- ============================================
-- TABLE: admin_users (Super admins)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FUNCTIONS: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_settings_updated_at BEFORE UPDATE ON event_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();