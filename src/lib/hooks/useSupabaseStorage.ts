import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function useSupabaseStorage<T>(eventId: string, tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger depuis Supabase
  const loadFromSupabase = async () => {
    try {
      const { data: rows, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setData(rows || []);
    } catch (error) {
      console.error(`Erreur chargement ${tableName}:`, error);
      // Fallback vers localStorage
      const stored = localStorage.getItem(`${tableName}_${eventId}`);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans Supabase
  const saveToSupabase = async (newData: T[]) => {
    try {
      // Supprimer les anciennes données
      await supabase
        .from(tableName)
        .delete()
        .eq('event_id', eventId);

      // Insérer les nouvelles
      const { error } = await supabase
        .from(tableName)
        .insert(
          newData.map(item => ({ ...item, event_id: eventId }))
        );

      if (error) throw error;
      setData(newData);
      localStorage.setItem(`${tableName}_${eventId}`, JSON.stringify(newData));
    } catch (error) {
      console.error(`Erreur sauvegarde ${tableName}:`, error);
      // Fallback localStorage
      localStorage.setItem(`${tableName}_${eventId}`, JSON.stringify(newData));
      setData(newData);
    }
  };

  // Ajouter un élément
  const add = async (item: T) => {
    const newData = [...data, item];
    await saveToSupabase(newData);
  };

  // Mettre à jour un élément
  const update = async (id: string, updates: Partial<T>) => {
    const newData = data.map(item =>
      (item as any).id === id ? { ...item, ...updates } : item
    );
    await saveToSupabase(newData);
  };

  // Supprimer un élément
  const remove = async (id: string) => {
    const newData = data.filter(item => (item as any).id !== id);
    await saveToSupabase(newData);
  };

  useEffect(() => {
    loadFromSupabase();
  }, [eventId]);

  return {
    data,
    loading,
    add,
    update,
    remove,
    reload: loadFromSupabase
  };
}