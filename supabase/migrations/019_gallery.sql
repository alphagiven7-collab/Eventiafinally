-- Galerie publique : le propriétaire choisit si son invitation publiée y apparaît.
-- Masquée par défaut. Aucune donnée d'invité n'est exposée.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS show_in_gallery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS events_gallery_idx
  ON public.events (show_in_gallery, is_published)
  WHERE show_in_gallery = true AND is_published = true;

NOTIFY pgrst, 'reload schema';
