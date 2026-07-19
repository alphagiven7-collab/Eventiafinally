-- ============================================
-- RESET COMPLET - Supprime tout et recrée
-- Exécutez ceci D'ABORD, puis 003_minimal.sql
-- ============================================

DROP TABLE IF EXISTS rsvps CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;