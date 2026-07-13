-- Phase 4 : RLS Policies pour isolation multi-tenant

-- 1. Users : voir son propre profil
CREATE POLICY "Users view own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- 2. Events : voir seulement ses événements
CREATE POLICY "Users view own events" ON events
  FOR SELECT USING (user_id = auth.uid());

-- 3. Events : créer un événement
CREATE POLICY "Users create events" ON events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Events : modifier seulement ses événements
CREATE POLICY "Users update own events" ON events
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Events : supprimer seulement ses événements
CREATE POLICY "Users delete own events" ON events
  FOR DELETE USING (user_id = auth.uid());

-- 6. Guests : voir seulement les invités de ses événements
CREATE POLICY "Users view own guests" ON guests
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- 7. Guests : gérer les invités de ses événements
CREATE POLICY "Users manage own guests" ON guests
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- 8. RSVP : voir seulement les RSVP de ses événements
CREATE POLICY "Users view own rsvps" ON rsvps
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- 9. Check-ins : voir seulement les check-ins de ses événements
CREATE POLICY "Users view own checkins" ON checkins
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- 10. Super admin : voit tout
CREATE POLICY "Super admin sees all on events" ON events
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY "Super admin sees all on guests" ON guests
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE user_id IN (
      SELECT id FROM users WHERE role = 'super_admin'
    ))
  );