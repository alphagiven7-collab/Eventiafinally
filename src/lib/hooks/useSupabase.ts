'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EventWithSettings, Guest } from '@/types';

export function useSupabase() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { supabase, user, loading };
}

export function useEvents() {
  const { supabase, user } = useSupabase();
  const [events, setEvents] = useState<EventWithSettings[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_settings(*)')
        .eq('user_id', user.id);

      if (!error && data) {
        setEvents(data as EventWithSettings[]);
      }
    }

    fetchEvents();
  }, [supabase, user]);

  return { events };
}

export function useGuests(eventId: string) {
  const { supabase } = useSupabase();
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    if (!eventId) return;

    async function fetchGuests() {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId);

      if (!error && data) {
        setGuests(data);
      }
    }

    fetchGuests();
  }, [supabase, eventId]);

  return { guests, setGuests };
}