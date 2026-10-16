-- Invitation hébergée : le lien public lit event_settings,
-- y compris pour un visiteur non connecté.

ALTER TABLE event_settings
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

DROP POLICY IF EXISTS "Public read published settings" ON event_settings;

CREATE POLICY "Public read published settings" ON event_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_settings.event_id
        AND events.is_published = true
    )
  );
