'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui';
import { EventWithSettings, Guest, GuestStatus } from '@/types';
import { fetchInvitationBySlug, fromDatabase, listInvitations, publishInvitation } from '@/lib/events/store';
import { isCurrentSuperAdmin } from '@/lib/admin/session';
import { addGuest, addGuests, deleteGuest, guestInvitePath, listAllEventGuests, updateGuest, type GuestDraft } from '@/lib/guests/store';
import { parseGuestCsv } from '@/lib/guests/csv';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { guestCapacity, TRIAL_INVITATIONS } from '@/constants/pricing';
import { duplicateIdsToRemove, isCoupleName, normalizeGuestName, seatsAtTable } from '@/lib/guests/seating';
import { SUPABASE_REQUIRED } from '@/providers/auth-provider';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Download,
  MessageCircle,
  Check,
  X,
  Pencil,
  QrCode,
  Trash2,
  Mail,
  ChevronDown,
  UserPlus,
} from 'lucide-react';

type Tab = 'overview' | 'guests' | 'rsvps' | 'exports';
type GuestTool = 'add' | 'import' | 'tables' | 'whatsapp' | 'duplicates';

function drinkLabel(guest: Guest, catalog: { id: string; name: string }[]): string {
  const names = new Map(catalog.map((drink) => [drink.id, drink.name]));
  return (guest.drink_preferences || '')
    .split(',')
    .map((id) => names.get(id.trim()) || '')
    .filter(Boolean)
    .join(', ');
}

function GuestManagementContent() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('guests');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const [openTool, setOpenTool] = useState<GuestTool | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsReady, setDetailsReady] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const [shareOrigin, setShareOrigin] = useState('');

  // Formulaire ajout : seul le nom est obligatoire
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTable, setNewTable] = useState('');
  const [newCouple, setNewCouple] = useState(false);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [zipFailures, setZipFailures] = useState<{ name: string; reason: string }[]>([]);
  const zipLock = useRef(false);
  const [tableName, setTableName] = useState('');
  const [tableSeats, setTableSeats] = useState('8');
  const [csvPreview, setCsvPreview] = useState<null | {
    ready: GuestDraft[];
    bad: { line: number; text: string; reason: string }[];
    duplicates: string[];
  }>(null);

  // WhatsApp template
  const [waTemplate, setWaTemplate] = useState('Bonjour {nom}, voici votre invitation personnelle : {lien}');

  // Charger les événements
  useEffect(() => {
    async function load() {
      if (!user?.id) { setLoading(false); return; }
      try {
        if (!isSupabaseReady()) {
          setEvents([]);
          setLoading(false);
          return;
        }
        const evts = await listInvitations(createClient(), user.id);
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('event');
        let available = evts;
        const match = evts.find((event) => event.id === requested);
        if (requested && !match && await isCurrentSuperAdmin(user.id)) {
          const { data } = await createClient().from('events').select('*').eq('id', requested).maybeSingle();
          if (data) available = [fromDatabase(data), ...evts];
        }
        setEvents(available);
        const chosen = available.find((event) => event.id === requested);
        if (chosen) setSelectedEventId(chosen.id);
        else if (available.length > 0) setSelectedEventId(available[0].id);
        if (params.get('tab') === 'rsvps') setActiveTab('rsvps');
        if (params.get('tool') === 'add') {
          setActiveTab('guests');
          setOpenTool('add');
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [user?.id]);

  useEffect(() => {
    const selected = eventsRef.current.find((event) => event.id === selectedEventId);
    if (!selected?.slug || !isSupabaseReady()) return;
    let cancelled = false;
    setDetailsReady(false);
    fetchInvitationBySlug(createClient(), selected.slug, { includeMusic: false }).then((full) => {
      if (cancelled || !full) return;
      setEvents((current) => current.map((event) => event.id === full.id ? { ...event, ...full } : event));
      setDetailsReady(true);
    });
    return () => { cancelled = true; };
  }, [selectedEventId]);

  // Charger les invités enregistrés pour cette invitation
  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function loadGuests() {
      if (!isSupabaseReady()) {
        if (!cancelled) setGuests([]);
        return;
      }
      const result = await listAllEventGuests(createClient(), selectedEventId);
      if (cancelled) return;
      if (result.error) addToast('error', result.error);
      setGuests(result.guests);
    }
    loadGuests();
    return () => { cancelled = true; };
  }, [selectedEventId, addToast]);

  // Stats
  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.status === 'confirmed').length,
    declined: guests.filter(g => g.status === 'declined').length,
    pending: guests.filter(g => g.status === 'pending').length,
    adults: guests.reduce((s, g) => s + (g.adults || 1), 0),
    children: guests.reduce((s, g) => s + (g.children || 0), 0),
  };

  // Filtrage
  const statusOrder: Record<GuestStatus, number> = { confirmed: 0, pending: 1, declined: 2 };
  const filteredGuests = guests.filter(g => {
    if (filter !== 'all' && g.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const catalog = events.find((event) => event.id === selectedEventId)?.drinks || [];
      return g.name.toLowerCase().includes(q) || (g.phone || '').includes(q) || (g.email || '').toLowerCase().includes(q) || drinkLabel(g, catalog).toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name, 'fr'));

  const personalLink = (guest: Guest) => {
    const slug = events.find((event) => event.id === selectedEventId)?.slug || '';
    return `${shareOrigin}${guestInvitePath(slug, guest)}`;
  };

  const whatsAppShareHref = (guest: Guest) => {
    const text = waTemplate.replaceAll('{nom}', guest.name).replaceAll('{lien}', personalLink(guest));
    const phone = (guest.phone || '').replace(/[^0-9]/g, '');
    const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
    return `${base}?text=${encodeURIComponent(text)}`;
  };

  useEffect(() => {
    setShareOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (openTool !== 'add' || loading) return;
    const frame = window.requestAnimationFrame(() => nameInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [openTool, loading]);

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const tables = selectedEvent?.tables || [];
  const seatsUsed = (name: string) => guests.reduce((sum, guest) => (
    guest.table_number === name ? sum + seatsAtTable(guest) : sum
  ), 0);
  const duplicateIds = duplicateIdsToRemove(guests);
  const duplicateGroups = (() => {
    const grouped = new Map<string, Guest[]>();
    for (const guest of guests) {
      const key = normalizeGuestName(guest.name);
      if (!key) continue;
      const list = grouped.get(key) ?? [];
      list.push(guest);
      grouped.set(key, list);
    }
    return [...grouped.values()].filter((group) => group.length > 1);
  })();

  const saveTables = async (next: { name: string; seats: number }[]) => {
    if (!selectedEvent || !user?.id || !isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
      return;
    }
    if (!detailsReady) {
      addToast('error', 'L’invitation est encore en chargement.');
      return;
    }
    const result = await publishInvitation(createClient(), {
      ...selectedEvent,
      tables: next,
      user_id: user.id,
      is_published: selectedEvent.is_published,
    });
    if (result.error) {
      addToast('error', result.error);
      return;
    }
    setEvents((current) => current.map((event) => event.id === selectedEvent.id ? { ...event, tables: next } : event));
  };

  const [publishing, setPublishing] = useState(false);
  const publishNow = async () => {
    if (!selectedEvent || !user?.id || !isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
      return;
    }
    setPublishing(true);
    const full = await fetchInvitationBySlug(createClient(), selectedEvent.slug);
    if (!full) {
      setPublishing(false);
      addToast('error', 'Invitation introuvable. Réessayez.');
      return;
    }
    const result = await publishInvitation(createClient(), { ...full, user_id: user.id, is_published: true });
    setPublishing(false);
    if (result.error) {
      addToast('error', result.error);
      return;
    }
    setEvents((current) => current.map((event) => event.id === selectedEvent.id ? { ...event, is_published: true } : event));
    addToast('success', 'Invitation publiée. Vous pouvez envoyer les liens.');
  };

  // Ajouter un invité
  const handleAddGuest = async () => {
    if (!newName.trim()) { addToast('error', 'Le nom est obligatoire.'); return; }
    if (!isSupabaseReady()) { addToast('error', SUPABASE_REQUIRED); return; }
    const couple = newCouple || isCoupleName(newName);
    const result = await addGuest(createClient(), selectedEventId, {
      name: newName,
      phone: newPhone,
      tableNumber: newTable,
      adults: couple ? 2 : 1,
    }, capacity);
    if (result.error || !result.guest) {
      addToast('error', result.error || 'Invité non enregistré');
      return;
    }
    setGuests((current) => [result.guest!, ...current]);
    setNewName('');
    setNewPhone('');
    setNewCouple(false);
    addToast('success', `${result.guest.name} ajouté(e). Le lien personnel est prêt.`);
    nameInputRef.current?.focus();
  };

  const assignTable = async (guest: Guest, tableNumber: string) => {
    const previous = guest.table_number;
    const optimistic = { ...guest, table_number: tableNumber || undefined };
    setGuests((list) => list.map((item) => item.id === guest.id ? optimistic : item));
    if (!isSupabaseReady()) {
      setGuests((list) => list.map((item) => item.id === guest.id ? guest : item));
      addToast('error', SUPABASE_REQUIRED);
      return;
    }
    const result = await updateGuest(createClient(), optimistic);
    if (result.error || !result.guest) {
      setGuests((list) => list.map((item) => item.id === guest.id ? { ...item, table_number: previous } : item));
      addToast('error', result.error || 'Table non enregistrée');
      return;
    }
    setGuests((list) => list.map((item) => item.id === guest.id ? result.guest! : item));
  };

  const handleRemoveDuplicates = async () => {
    if (duplicateIds.length === 0 || !isSupabaseReady()) {
      if (!isSupabaseReady()) addToast('error', SUPABASE_REQUIRED);
      return;
    }
    setRemovingDuplicates(true);
    const removed = new Set<string>();
    for (const id of duplicateIds) {
      const result = await deleteGuest(createClient(), id);
      if (result.error) {
        setRemovingDuplicates(false);
        addToast('error', result.error);
        if (removed.size > 0) setGuests((current) => current.filter((guest) => !removed.has(guest.id)));
        return;
      }
      removed.add(id);
    }
    setGuests((current) => current.filter((guest) => !removed.has(guest.id)));
    setRemovingDuplicates(false);
    addToast('success', removed.size > 1 ? `${removed.size} doublons retirés.` : '1 doublon retiré.');
  };

  // Supprimer un invité
  const handleDelete = async (id: string) => {
    if (!isSupabaseReady()) { addToast('error', SUPABASE_REQUIRED); return; }
    const result = await deleteGuest(createClient(), id);
    if (result.error) { addToast('error', result.error); return; }
    setGuests((current) => current.filter((guest) => guest.id !== id));
    addToast('success', 'Invité supprimé');
  };

  // Modifier statut
  const handleStatusChange = async (id: string, status: GuestStatus) => {
    const current = guests.find((guest) => guest.id === id);
    if (!current || !isSupabaseReady()) return;
    const result = await updateGuest(createClient(), { ...current, status });
    if (result.error || !result.guest) { addToast('error', result.error || 'Statut non enregistré'); return; }
    setGuests((list) => list.map((guest) => guest.id === id ? result.guest! : guest));
  };

  // Sauvegarder édition
  const handleSaveEdit = async () => {
    if (!editingGuest) return;
    if (!editingGuest.name.trim()) { addToast('error', 'Le nom est obligatoire.'); return; }
    if (!isSupabaseReady()) { addToast('error', SUPABASE_REQUIRED); return; }
    const result = await updateGuest(createClient(), editingGuest);
    if (result.error || !result.guest) { addToast('error', result.error || 'Invité non enregistré'); return; }
    setGuests((list) => list.map((guest) => guest.id === result.guest!.id ? result.guest! : guest));
    setEditingGuest(null);
    addToast('success', 'Invité enregistré');
  };

  const capacity = selectedEvent
    ? (selectedEvent.guestLimit ?? guestCapacity(selectedEvent.guestPack))
    : guestCapacity();
  const withoutTable = guests.filter((guest) => !guest.table_number?.trim());
  const tableChoices = (current?: string) => {
    const names = tables.map((table) => table.name);
    if (current && !names.includes(current)) names.push(current);
    return names;
  };

  const handlePreviewCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const { ready, bad, duplicates } = parseGuestCsv(text, guests.map((guest) => guest.name));
    if (ready.length + bad.length + duplicates.length === 0) return;
    setCsvPreview({ ready, bad, duplicates });
  };

  const confirmCsvImport = async () => {
    if (!csvPreview || !isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
      return;
    }
    const result = await addGuests(createClient(), selectedEventId, csvPreview.ready, capacity);
    if (result.guests.length > 0) {
      setGuests((current) => [...result.guests, ...current]);
    }
    if (result.error) {
      addToast('error', result.guests.length > 0
        ? `${result.guests.length} invité(s) enregistré(s). ${result.error}`
        : result.error);
    } else {
      addToast('success', `${result.guests.length} invités enregistrés.`);
    }
    setCsvPreview(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = 'nom,telephone,groupe,email,statut,adultes,enfants,boissons\n';
    const catalog = selectedEvent?.drinks || [];
    const rows = guests.map(g =>
      `"${g.name}","${g.phone || ''}","${g.group || ''}","${g.email || ''}","${g.status}",${g.adults || 1},${g.children || 0},"${drinkLabel(g, catalog)}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export CSV téléchargé');
  };

  // Export JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(guests, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invites-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export JSON téléchargé');
  };

  const exportAllPdfs = async () => {
    if (zipLock.current) return;
    const selected = events.find((event) => event.id === selectedEventId);
    if (!user?.id || !selected) {
      addToast('error', 'Choisissez un mariage avant d’exporter les PDF.');
      return;
    }
    if (selected.user_id && selected.user_id !== user.id) {
      addToast('error', 'Vous ne pouvez exporter que les invités de vos mariages.');
      return;
    }
    if (!isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
      return;
    }
    zipLock.current = true;
    setZipFailures([]);
    setZipProgress({ done: 0, total: guests.length });
    try {
      const loaded = await listAllEventGuests(createClient(), selected.id);
      if (loaded.error) {
        addToast('error', loaded.error);
        return;
      }
      if (loaded.guests.length === 0) {
        addToast('error', 'Aucun invité enregistré pour cette invitation.');
        return;
      }
      setZipProgress({ done: 0, total: loaded.guests.length });
      const { generateInvitationsZip, downloadBlob } = await import('@/lib/invitation/pdf');
      const result = await generateInvitationsZip(
        selected,
        loaded.guests.map((guest) => ({
          id: guest.id,
          name: guest.name,
          table: guest.table_number,
        })),
        (done, total) => setZipProgress({ done, total }),
      );
      if (result.failures.length > 0) {
        setZipFailures(result.failures);
        addToast('error', `${result.failures.length} PDF n’ont pas pu être créés. L’archive n’a pas été téléchargée.`);
        return;
      }
      downloadBlob(result.blob, result.filename);
      addToast('success', `${loaded.guests.length} PDF réunis dans le fichier ZIP.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'L’export PDF a échoué.';
      addToast('error', message);
    } finally {
      zipLock.current = false;
      setZipProgress(null);
    }
  };

  const pdfZipControls = (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-2">
      <p className="text-xs text-gray-600 dark:text-gray-300">
        {guests.length} PDF {guests.length > 1 ? 'seront générés' : 'sera généré'}, un par invité de la liste complète.
      </p>
      <button
        type="button"
        onClick={() => void exportAllPdfs()}
        disabled={Boolean(zipProgress) || guests.length === 0}
        className="w-full min-h-12 px-4 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60"
      >
        {zipProgress ? `${zipProgress.done} / ${zipProgress.total}` : 'Télécharger tous les PDF (ZIP)'}
      </button>
      {zipFailures.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-2">
          <p className="font-semibold">Ces invitations n’ont pas été créées. L’archive n’a pas été téléchargée.</p>
          <ul className="space-y-1">
            {zipFailures.map((failure) => (
              <li key={`${failure.name}-${failure.reason}`}>{failure.name} : {failure.reason}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void exportAllPdfs()}
            disabled={Boolean(zipProgress)}
            className="min-h-10 px-3 rounded-lg bg-red-700 text-white font-semibold"
          >
            Relancer l’export
          </button>
        </div>
      )}
    </div>
  );

  const statusLabel = (s: GuestStatus) => {
    if (s === 'confirmed') return '✅ Confirmé';
    if (s === 'declined') return '❌ Refus';
    return '⏳ En attente';
  };

  const statusColor = (s: GuestStatus) => {
    if (s === 'confirmed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'declined') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invités</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-700">
          {[
            { id: 'overview' as Tab, icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Vue d\'ensemble' },
            { id: 'guests' as Tab, icon: <Users className="w-3.5 h-3.5" />, label: 'Invités' },
            { id: 'rsvps' as Tab, icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Confirmations' },
            { id: 'exports' as Tab, icon: <Download className="w-3.5 h-3.5" />, label: 'Exports' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 min-h-11 px-3 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 transition ${activeTab === tab.id ? 'bg-violet-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {tab.icon} <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════ VUE D'ENSEMBLE ═══════ */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total invités', value: stats.total, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
              { label: 'Confirmés', value: stats.confirmed, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
              { label: 'Refus', value: stats.declined, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
              { label: 'En attente', value: stats.pending, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
              { label: 'Adultes', value: stats.adults, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
              { label: 'Enfants', value: stats.children, color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
              { label: 'Places', value: `${stats.total}/${capacity}`, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
          {(selectedEvent?.drinks || []).some((drink) => guests.some((guest) => (guest.drink_preferences || '').split(',').includes(drink.id))) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Boissons choisies</h2>
              <ul className="space-y-2">
                {(selectedEvent?.drinks || []).map((drink) => {
                  const count = guests.filter((guest) => (guest.drink_preferences || '').split(',').includes(drink.id)).length;
                  if (!count) return null;
                  return (
                    <li key={drink.id} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200">
                      <span>{drink.name}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          </div>
        )}

        {/* ═══════ INVITÉS ═══════ */}
        {activeTab === 'guests' && (
          <div className="space-y-3">
            <button
              type="button"
              aria-expanded={openTool === 'add'}
              onClick={() => setOpenTool((current) => current === 'add' ? null : 'add')}
              className={`w-full min-h-12 px-4 rounded-2xl text-sm font-semibold inline-flex items-center justify-between gap-2 ${
                openTool === 'add' ? 'bg-violet-700 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus className="w-4 h-4 shrink-0" />
                Ajouter un invité
              </span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition ${openTool === 'add' ? 'rotate-180' : ''}`} />
            </button>
            {openTool === 'add' && (
              <form
                onSubmit={(event) => { event.preventDefault(); void handleAddGuest(); }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-200 dark:border-violet-900 p-3 space-y-2"
              >
                <p className="text-xs text-gray-600 dark:text-gray-300">Écrivez le nom, puis validez. Le téléphone et la table sont facultatifs.</p>
                <div className="flex gap-2">
                  <input
                    id="guest-name"
                    ref={nameInputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nom de l'invité"
                    aria-label="Nom de l'invité"
                    className="min-w-0 flex-1 min-h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button type="submit" className="shrink-0 min-h-11 px-4 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition">
                    Ajouter
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    aria-label="Table du nouvel invité"
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    className="min-w-0 flex-1 min-h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Sans table</option>
                    {tableChoices(newTable).map((name) => {
                      const table = tables.find((item) => item.name === name);
                      return (
                        <option key={name} value={name}>
                          {table ? `${name} · ${seatsUsed(name)}/${table.seats}` : name}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Tél. facultatif"
                    inputMode="tel"
                    aria-label="Téléphone, facultatif"
                    className="min-w-0 w-[42%] min-h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <label className="flex items-center gap-2 min-h-11 text-xs text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={newCouple || isCoupleName(newName)}
                    onChange={(e) => setNewCouple(e.target.checked)}
                    className="w-5 h-5 accent-violet-600"
                  />
                  Couple : une seule invitation, 2 places à table
                </label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Seul le nom est obligatoire. {guests.length}/{capacity} invitations, dont {TRIAL_INVITATIONS} d&apos;essai. Un couple compte pour une seule invitation.
                </p>
              </form>
            )}

            <div className="grid grid-cols-3 gap-2">
              {([
                ['import', 'Importer'],
                ['tables', 'Tables'],
                ['whatsapp', 'WhatsApp'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-expanded={openTool === id}
                  onClick={() => setOpenTool((current) => current === id ? null : id)}
                  className={`min-h-11 px-2 rounded-xl text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1 ${
                    openTool === id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <span>{label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition ${openTool === id ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>

            {pdfZipControls}

            {openTool === 'import' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Importer des invités</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Colonnes reconnues par leur titre : <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">nom, telephone, groupe, email, table</code>. Seul le nom est obligatoire. Les séparateurs , et ; sont acceptés.</p>
                <label className="inline-flex min-h-11 items-center px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-medium cursor-pointer hover:bg-violet-700 transition">
                  Choisir un fichier CSV
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={handlePreviewCSV} />
                </label>
                {csvPreview && (
                  <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-600 p-3 space-y-2 text-xs">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{csvPreview.ready.length} ligne(s) prête(s) à importer</p>
                    {csvPreview.duplicates.length > 0 && (
                      <p className="text-amber-700 dark:text-amber-300">Doublons écartés : {csvPreview.duplicates.join(', ')}</p>
                    )}
                    {csvPreview.bad.length > 0 && (
                      <ul className="text-red-600 space-y-1">
                        {csvPreview.bad.map((row) => (
                          <li key={`${row.line}-${row.text}`}>Ligne {row.line} : {row.reason}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void confirmCsvImport()} className="px-3 py-2 bg-violet-600 text-white rounded-lg font-semibold">Importer ces lignes</button>
                      <button type="button" onClick={() => setCsvPreview(null)} className="px-3 py-2 border rounded-lg">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {openTool === 'tables' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Tables et places</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  Créez la table ici, puis choisissez-la sur la ligne de l&apos;invité. Un couple occupe 2 places à la table, mais ne compte que pour une invitation.
                </p>
                <div className="flex gap-2 mb-3">
                  <input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Nom, ex. Famille"
                    className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  <input value={tableSeats} onChange={(e) => setTableSeats(e.target.value)} type="number" min={1} placeholder="Places" aria-label="Nombre de places"
                    className="w-20 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  <button
                    type="button"
                    onClick={() => {
                      const name = tableName.trim();
                      const seats = Math.max(1, Number(tableSeats) || 1);
                      if (!name) return;
                      void saveTables([...tables.filter((table) => table.name !== name), { name, seats }]);
                      setTableName('');
                      setNewTable(name);
                    }}
                    className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-medium shrink-0"
                  >
                    Ajouter
                  </button>
                </div>
                {tables.length > 0 && (
                  <div className="space-y-2">
                    {tables.map((table) => {
                      const used = seatsUsed(table.name);
                      return (
                        <div key={table.name} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{table.name}</p>
                            <p className={`text-[11px] ${used > table.seats ? 'text-red-600 font-semibold' : 'text-blue-600 dark:text-blue-300'}`}>
                              {used}/{table.seats} places{used > table.seats ? ' · au-dessus du nombre de places' : ''}
                            </p>
                          </div>
                          <button type="button" onClick={() => void saveTables(tables.filter((item) => item.name !== table.name))} className="text-xs text-red-500 shrink-0">Retirer</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {withoutTable.length > 0 && (
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    {withoutTable.length} invité(s) sans table.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              aria-expanded={openTool === 'duplicates'}
              onClick={() => setOpenTool((current) => current === 'duplicates' ? null : 'duplicates')}
              className={`w-full min-h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-between gap-2 ${
                openTool === 'duplicates'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
              }`}
            >
              <span>Supprimer les doublons{duplicateIds.length > 0 ? ` · ${duplicateIds.length}` : ''}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition ${openTool === 'duplicates' ? 'rotate-180' : ''}`} />
            </button>
            {openTool === 'duplicates' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Noms en double</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  Une fiche est gardée, de préférence celle qui a déjà une table ou un téléphone. Les autres sont retirées.
                </p>
                {duplicateGroups.length === 0 ? (
                  <p className="text-xs text-gray-600 dark:text-gray-300">Aucun doublon.</p>
                ) : (
                  <div className="space-y-2">
                    {duplicateGroups.map((group) => (
                      <p key={group[0].id} className="text-xs text-gray-800 dark:text-gray-100">
                        {group[0].name} · {group.length} fiches, {group.length - 1} à retirer
                      </p>
                    ))}
                    <button
                      type="button"
                      onClick={() => void handleRemoveDuplicates()}
                      disabled={removingDuplicates}
                      className="min-h-11 px-4 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {removingDuplicates ? 'Suppression...' : 'Retirer les doublons'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {openTool === 'whatsapp' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Message WhatsApp</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Variables : <strong>{'{nom}'}</strong> et <strong>{'{lien}'}</strong></p>
                <textarea value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none" />
              </div>
            )}

            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un invité"
                className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'declined')}
                aria-label="Filtrer par statut"
                className="min-w-0 w-28 px-2 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmés</option>
                <option value="declined">Refus</option>
              </select>
            </div>

            {/* Tableau */}
            {filteredGuests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun invité pour l&apos;instant. Ouvrez « Ajouter un invité ».</p>
              </div>
            ) : (
              <div className="space-y-3">
                      {filteredGuests.map(g => (
                        <article key={g.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                            <div className="flex items-start justify-between gap-3">
                            <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{g.name}</p>
                            <p className="text-[11px] text-gray-500">{g.phone || 'Sans téléphone'}{g.group ? ` · ${g.group}` : ''}</p>
                            <p className="text-[11px] text-gray-400">{g.adults || 1} adulte(s){g.children > 0 ? ` · ${g.children} enfant(s)` : ''}{seatsAtTable(g) >= 2 ? ` · ${seatsAtTable(g)} places à la table` : ''}{g.checked_in_at ? ' · En salle' : ''}</p>
                            {drinkLabel(g, selectedEvent?.drinks || []) && (
                              <p className="text-[11px] text-violet-700 dark:text-violet-300">Boisson : {drinkLabel(g, selectedEvent?.drinks || [])}</p>
                            )}
                            </div>
                            <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(g.status)}`}>
                              {statusLabel(g.status)}
                            </span>
                            </div>
                            {selectedEvent?.is_published ? (
                              <a
                                href={whatsAppShareHref(g)}
                                target="_blank"
                                rel="noopener"
                                className="mt-3 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1ebe5d]"
                              >
                                <MessageCircle className="w-4 h-4 shrink-0" />
                                Envoyer par WhatsApp
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void publishNow()}
                                disabled={publishing}
                                className="mt-3 w-full min-h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100 disabled:opacity-60"
                              >
                                {publishing ? 'Publication…' : 'Publier'}
                              </button>
                            )}
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              aria-label={`Table de ${g.name}`}
                              value={g.table_number || ''}
                              onChange={(e) => void assignTable(g, e.target.value)}
                              className="min-w-0 w-full sm:max-w-xs min-h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Sans table</option>
                              {tableChoices(g.table_number).map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                            {tables.length === 0 && (
                              <button type="button" onClick={() => setOpenTool('tables')} className="text-xs font-semibold text-violet-700 dark:text-violet-300 text-left">
                                Créer une table
                              </button>
                            )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {g.status !== 'confirmed' && (
                                <button onClick={() => handleStatusChange(g.id, 'confirmed')} title="Confirmer"
                                  className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition text-xs"><Check className="w-3.5 h-3.5" /></button>
                              )}
                              {g.status !== 'declined' && (
                                <button onClick={() => handleStatusChange(g.id, 'declined')} title="Refuser"
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-xs"><X className="w-3.5 h-3.5" /></button>
                              )}
                              <button onClick={() => setEditingGuest(g)} title="Modifier"
                                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition text-xs"><Pencil className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => {
                                  void import('@/lib/guests/checkin-qr').then(async ({ checkinQrDataUrl }) => {
                                    const src = await checkinQrDataUrl(g.token, 280);
                                    const w = window.open('', '_blank');
                                    if (!w) return;
                                    const safe = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
                                    const tableLine = g.table_number ? `Table ${g.table_number}` : 'Sans table';
                                    w.document.write(`<title>Entrée - ${safe(g.name)}</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;font-family:sans-serif}</style><div style="text-align:center"><img src="${src}" style="width:280px;height:280px"><p style="margin-top:16px;font-size:18px;color:#111"><strong>${safe(g.name)}</strong></p><p style="font-size:14px;color:#2563eb">${safe(tableLine)}</p><p style="font-size:12px;color:#666;margin-top:8px">Montrez cette carte à l'entrée</p></div>`);
                                  });
                                }}
                                title="QR d'entrée"
                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition text-xs"><QrCode className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(g.id)} title="Supprimer"
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-xs"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </article>
                      ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ CONFIRMATIONS ═══════ */}
        {activeTab === 'rsvps' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Confirmations RSVP</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">Liste des invités ayant confirmé ou refusé.</p>
              {guests.filter(g => g.status !== 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucune confirmation reçue pour l'instant.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {guests.filter(g => g.status !== 'pending').map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</p>
                        <p className="text-[10px] text-gray-400">{g.adults || 1} adulte(s) {g.children > 0 ? `· ${g.children} enfant(s)` : ''}</p>
                        {drinkLabel(g, selectedEvent?.drinks || []) && (
                          <p className="text-[10px] text-violet-700 dark:text-violet-300">Boisson : {drinkLabel(g, selectedEvent?.drinks || [])}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(g.status)}`}>
                        {statusLabel(g.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ EXPORTS ═══════ */}
        {activeTab === 'exports' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              <span>Exporter les données</span>
            </h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">Téléchargez vos listes pour archivage ou impression.</p>
            {pdfZipControls}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={handleExportCSV} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 transition">
                Export CSV
              </button>
              <button onClick={handleExportJSON} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Export JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ MODAL ÉDITION ═══════ */}
      {editingGuest && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingGuest(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Modifier l'invité</h3>
              <button onClick={() => setEditingGuest(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet *</label>
                <input value={editingGuest.name} onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                  <input value={editingGuest.phone || ''} onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value || undefined })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email, facultatif</label>
                  <input value={editingGuest.email || ''} onChange={(e) => setEditingGuest({ ...editingGuest, email: e.target.value || undefined })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Groupe</label>
                <input value={editingGuest.group || ''} onChange={(e) => setEditingGuest({ ...editingGuest, group: e.target.value || undefined })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                  <select value={editingGuest.status} onChange={(e) => setEditingGuest({ ...editingGuest, status: e.target.value as GuestStatus })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="declined">Refus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Adultes</label>
                  <input type="number" min={0} value={editingGuest.adults || 1} onChange={(e) => setEditingGuest({ ...editingGuest, adults: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enfants</label>
                  <input type="number" min={0} value={editingGuest.children || 0} onChange={(e) => setEditingGuest({ ...editingGuest, children: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Table</label>
                <select value={editingGuest.table_number || ''} onChange={(e) => setEditingGuest({ ...editingGuest, table_number: e.target.value || undefined })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">Sans table</option>
                  {tableChoices(editingGuest.table_number).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditingGuest(null)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-500 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Annuler
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition">
                ✓ Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function GuestManagementPage() {
  return (
    <ProtectedRoute>
      <GuestManagementContent />
    </ProtectedRoute>
  );
}