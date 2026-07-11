-- ============================================
-- INVITIA - Database Migrations
-- Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- TABLE: templates
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('classic', 'contemporary', 'nature', 'minimal')),
  thumbnail_url TEXT,
  layout_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: events
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- ============================================
-- TABLE: guests
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for guests
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);

-- ============================================
-- TABLE: rsvp
-- ============================================
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending')),
  note TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id)
);

-- Indexes for rsvp
CREATE INDEX IF NOT EXISTS idx_rsvp_event_id ON rsvp(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_guest_id ON rsvp(guest_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see/update their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Events: Anyone can view published events, owners can manage all
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (is_published = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- Guests: Anyone can add guests (for RSVP), owners can view
CREATE POLICY "Anyone can insert guests" ON guests
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can view guests for published events" ON guests
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE is_published = TRUE)
  );

CREATE POLICY "Event owners can manage guests" ON guests
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- RSVP: Anyone can insert, event owners can view
CREATE POLICY "Anyone can insert rsvp" ON rsvp
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can view rsvp for published events" ON rsvp
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE is_published = TRUE)
  );

-- Templates: Anyone can view active templates
CREATE POLICY "Anyone can view active templates" ON templates
  FOR SELECT USING (is_active = TRUE);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events SET view_count = view_count + 1 WHERE slug = NEW.slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Templates
-- ============================================
INSERT INTO templates (name, slug, category, layout_config, is_active) VALUES
(
  'ÉLÉGANT',
  'elegant',
  'classic',
  '{"header": {"align": "center"}, "background": {"type": "gradient", "value": "linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)"}, "showCover": true, "showCountdown": true, "showMap": true, "showRSVP": true, "accentColor": "#D4AF37"}',
  TRUE
),
(
  'MODERNE',
  'modern',
  'contemporary',
  '{"header": {"align": "center"}, "background": {"type": "solid", "value": "#FFFFFF"}, "showCover": true, "showCountdown": true, "showMap": true, "showRSVP": true, "accentColor": "#D4AF37"}',
  TRUE
),
(
  'FLORAL',
  'floral',
  'nature',
  '{"header": {"align": "center"}, "background": {"type": "gradient", "value": "linear-gradient(135deg, #2D5A4A 0%, #4A7A6A 100%)"}, "showCover": true, "showCountdown": true, "showMap": true, "showRSVP": true, "accentColor": "#E8B4B8"}',
  TRUE
),
(
  'NATURE',
  'nature',
  'nature',
  '{"header": {"align": "center"}, "background": {"type": "gradient", "value": "linear-gradient(135deg, #3D5A3D 0%, #5A8A5A 100%)"}, "showCover": true, "showCountdown": true, "showMap": true, "showRSVP": true, "accentColor": "#F4E4BA"}',
  TRUE
),
(
  'MINIMAL',
  'minimal',
  'minimal',
  '{"header": {"align": "left"}, "background": {"type": "solid", "value": "#F8F4F0"}, "showCover": false, "showCountdown": true, "showMap": true, "showRSVP": true, "accentColor": "#1A1A2E"}',
  TRUE
) ON CONFLICT (slug) DO NOTHING;
