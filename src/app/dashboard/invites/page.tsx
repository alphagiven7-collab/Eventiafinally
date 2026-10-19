'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui';
import { EventWithSettings, Guest, GuestStatus } from '@/types';
import { listInvitations, publishInvitation } from '@/lib/events/store';
import { addGuest, addGuests, deleteGuest, guestInvitePath, listGuests, updateGuest } from '@/lib/guests/store';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { formatUsd, GUEST_PACKS, guestCapacity, packTotalUsd, TRIAL_INVITATIONS } from '@/constants/pricing';
import { SUPABASE_REQUIRED } from '@/providers/auth-provider';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Download,
  Upload,
  MessageCircle,
  Check,
  X,
  Pencil,
  QrCode,
  Trash2,
  Mail,
} from 'lucide-react';

type Tab = 'overview' | 'guests' | 'rsvps' | 'exports';

function GuestManagementContent() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState<EventWithSettings[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire ajout
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newTable, setNewTable] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableSeats, setTableSeats] = useState('8');
  const [packChoice, setPackChoice] = useState<number>(50);
  const [customPack, setCustomPack] = useState('250');
  const [confirmPack, setConfirmPack] = useState(false);
  const [csvPreview, setCsvPreview] = useState<null | {
    ready: { name: string; phone?: string; email?: string; group?: string }[];
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
        setEvents(evts);
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('event');
        const match = evts.find((event) => event.id === requested);
        if (match) setSelectedEventId(match.id);
        else if (evts.length > 0) setSelectedEventId(evts[0].id);
        if (params.get('tab') === 'rsvps') setActiveTab('rsvps');
      } catch {}
      setLoading(false);
    }
    load();
  }, [user?.id]);

  // Charger les invités enregistrés pour cette invitation
  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function loadGuests() {
      if (!isSupabaseReady()) {
        if (!cancelled) setGuests([]);
        return;
      }
      const result = await listGuests(createClient(), selectedEventId);
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
      return g.name.toLowerCase().includes(q) || (g.phone || '').includes(q) || (g.email || '').toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name, 'fr'));

  const personalLink = (guest: Guest) => {
    const slug = events.find((event) => event.id === selectedEventId)?.slug || '';
    return `${window.location.origin}${guestInvitePath(slug, guest)}`;
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const tables = selectedEvent?.tables || [];
  const seatsUsed = (name: string) => guests.filter((guest) => guest.table_number === name).length;

  const saveTables = async (next: { name: string; seats: number }[]) => {
    if (!selectedEvent || !user?.id || !isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
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

  // Ajouter un invité
  const handleAddGuest = async () => {
    if (!isSupabaseReady()) { addToast('error', SUPABASE_REQUIRED); return; }
    const result = await addGuest(createClient(), selectedEventId, {
      name: newName,
      phone: newPhone,
      email: newEmail,
      group: newGroup,
      tableNumber: newTable,
    }, capacity);
    if (result.error || !result.guest) {
      addToast('error', result.error || 'Invité non enregistré');
      return;
    }
    setGuests((current) => [result.guest!, ...current]);
    setNewName(''); setNewPhone(''); setNewEmail(''); setNewGroup(''); setNewTable('');
    setShowAddForm(false);
    addToast('success', `${result.guest.name} ajouté(e). Le lien personnel est prêt.`);
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
  const chosenPackSize = packChoice === 0 ? Math.max(1, Number(customPack) || 0) : packChoice;
  const withoutTable = guests.filter((guest) => !guest.table_number?.trim());

  const handlePreviewCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) return;
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('nom') || header.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const known = new Set(guests.map((guest) => guest.name.trim().toLowerCase()));
    const seen = new Set<string>();
    const ready: { name: string; phone?: string; email?: string; group?: string }[] = [];
    const bad: { line: number; text: string; reason: string }[] = [];
    const duplicates: string[] = [];
    dataLines.forEach((line, index) => {
      const parts = line.split(',').map((part) => part.trim().replace(/^"|"$/g, ''));
      const name = parts[0] || '';
      const lineNo = index + (hasHeader ? 2 : 1);
      if (!name || name.toLowerCase() === 'sans nom') {
        bad.push({ line: lineNo, text: line, reason: 'Nom manquant' });
        return;
      }
      const key = name.toLowerCase();
      if (known.has(key) || seen.has(key)) {
        duplicates.push(`${name} (ligne ${lineNo})`);
        return;
      }
      seen.add(key);
      ready.push({
        name,
        phone: parts[1] || undefined,
        group: parts[2] || undefined,
        email: parts[3] || undefined,
      });
    });
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

  const applyPack = async () => {
    if (!selectedEvent || !user?.id) return;
    const result = await publishInvitation(createClient(), {
      ...selectedEvent,
      user_id: user.id,
      is_published: selectedEvent.is_published,
      guestPack: chosenPackSize,
      guestLimit: guestCapacity(chosenPackSize),
    });
    if (result.error) {
      addToast('error', result.error);
      return;
    }
    setEvents((current) => current.map((event) => event.id === selectedEvent.id
      ? { ...event, guestPack: chosenPackSize, guestLimit: guestCapacity(chosenPackSize) }
      : event));
    setConfirmPack(false);
    addToast('success', `Forfait validé : ${chosenPackSize} invités, plus ${TRIAL_INVITATIONS} d'essai. Total ${formatUsd(packTotalUsd(chosenPackSize))}.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = 'nom,telephone,groupe,email,statut,adultes,enfants\n';
    const rows = guests.map(g =>
      `"${g.name}","${g.phone || ''}","${g.group || ''}","${g.email || ''}","${g.status}",${g.adults || 1},${g.children || 0}`
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
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invités</h1>
        {events.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Événement en cours</label>
            <select value={selectedEventId} onChange={(e) => {
              setSelectedEventId(e.target.value);
              const url = new URL(window.location.href);
              url.searchParams.set('event', e.target.value);
              window.history.replaceState(null, '', `${url.pathname}${url.search}`);
            }}
              className="w-full px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              {events.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
            </select>
          </div>
        )}

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
        )}

        {/* ═══════ INVITÉS ═══════ */}
        {activeTab === 'guests' && (
          <div className="space-y-4">
            {/* Import CSV */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                <span>Importer des invités</span>
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Format CSV : <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">nom,telephone,groupe,email</code></p>
              <div className="flex flex-wrap gap-2">
                <label className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-medium cursor-pointer hover:bg-violet-700 transition">
                  Choisir un fichier CSV
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={handlePreviewCSV} />
                </label>
                <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  + Ajouter manuellement
                </button>
              </div>
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

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Capacité</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {guests.length}/{capacity} places. Les {TRIAL_INVITATIONS} invitations d&apos;essai sont en plus du forfait.
                {guests.length >= capacity ? ' La capacité est atteinte. Choisissez un forfait pour continuer.' : ''}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GUEST_PACKS.map((pack) => (
                  <button key={pack} type="button" onClick={() => { setPackChoice(pack); setConfirmPack(false); }}
                    className={`rounded-xl border p-3 text-left ${packChoice === pack ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-600'}`}>
                    <span className="block text-xs font-semibold">{pack}</span>
                    <span className="block text-sm font-bold">{formatUsd(packTotalUsd(pack))}</span>
                  </button>
                ))}
                <button type="button" onClick={() => setPackChoice(0)}
                  className={`rounded-xl border p-3 text-left ${packChoice === 0 ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-600'}`}>
                  <span className="block text-xs font-semibold">Autre</span>
                  <span className="block text-[11px]">0,30 $ × nombre</span>
                </button>
              </div>
              {packChoice === 0 && (
                <input type="number" min={1} value={customPack} onChange={(e) => setCustomPack(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 dark:bg-gray-700" />
              )}
              <p className="text-sm font-bold">Total affiché : {formatUsd(packTotalUsd(chosenPackSize))}</p>
              {!confirmPack ? (
                <button type="button" onClick={() => setConfirmPack(true)} className="px-4 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl text-xs font-bold">
                  Voir la validation
                </button>
              ) : (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                  <p className="text-xs">Valider {chosenPackSize} invités pour {formatUsd(packTotalUsd(chosenPackSize))} ? Les {TRIAL_INVITATIONS} invitations d&apos;essai restent en plus. La publication de l&apos;invitation ne change pas.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void applyPack()} className="px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold">Valider ce forfait</button>
                    <button type="button" onClick={() => setConfirmPack(false)} className="px-3 py-2 border rounded-lg text-xs">Annuler</button>
                  </div>
                </div>
              )}
            </div>

            {/* Tables */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Tables et places</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                Donnez un nom et un nombre de places. La table choisie apparaît sur la carte de l’invité. Le QR est le code d’entrée du jour J : le scan affiche le nom, la table, et enregistre l’arrivée dans la salle.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Nom, ex. Famille"
                  className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                <input value={tableSeats} onChange={(e) => setTableSeats(e.target.value)} type="number" min={1} placeholder="Places"
                  className="w-24 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                <button
                  type="button"
                  onClick={() => {
                    const name = tableName.trim();
                    const seats = Math.max(1, Number(tableSeats) || 1);
                    if (!name) return;
                    void saveTables([...tables.filter((table) => table.name !== name), { name, seats }]);
                    setTableName('');
                  }}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-medium"
                >
                  Ajouter la table
                </button>
              </div>
              {tables.length > 0 && (
                <div className="space-y-2">
                  {tables.map((table) => {
                    const used = seatsUsed(table.name);
                    return (
                      <div key={table.name} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{table.name}</p>
                          <p className={`text-[11px] ${used > table.seats ? 'text-red-600 font-semibold' : 'text-blue-600 dark:text-blue-300'}`}>
                            {used}/{table.seats} places{used > table.seats ? ' · cette table dépasse le nombre de places' : ''}
                          </p>
                        </div>
                        <button type="button" onClick={() => void saveTables(tables.filter((item) => item.name !== table.name))} className="text-xs text-red-500">Retirer</button>
                      </div>
                    );
                  })}
                </div>
              )}
              {withoutTable.length > 0 && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  Sans table : {withoutTable.map((guest) => guest.name).join(', ')}
                </p>
              )}
            </div>

            {/* Formulaire ajout */}
            {showAddForm && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Ajouter un invité</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  {guests.length}/{capacity} places utilisées, dont {TRIAL_INVITATIONS} invitations d&apos;essai.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet *</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Marie N."
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                    <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+243..."
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@..."
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Table</label>
                    <select value={newTable} onChange={(e) => setNewTable(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option value="">Sans table</option>
                      {tables.map((table) => (
                        <option key={table.name} value={table.name}>
                          {table.name} · {seatsUsed(table.name)}/{table.seats}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Groupe</label>
                    <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Famille, Amis..."
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleAddGuest} className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition">
                    ✓ Ajouter l'invité
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-500 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Message WhatsApp */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>Message WhatsApp</span>
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">Variables : <strong>{'{nom}'}</strong> et <strong>{'{lien}'}</strong></p>
              <textarea value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none" />
            </div>

            {/* Recherche + filtre */}
            <div className="flex flex-wrap gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher nom ou téléphone..."
                className="flex-1 min-w-[200px] px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun invité. Importez un CSV ou ajoutez manuellement.</p>
              </div>
            ) : (
              <div className="space-y-3">
                      {filteredGuests.map(g => (
                        <article key={g.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                            <div className="flex items-start justify-between gap-3">
                            <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{g.name}</p>
                            <p className="text-[11px] text-gray-500">{g.phone || 'Sans téléphone'}{g.email ? ` · ${g.email}` : ''}{g.group ? ` · ${g.group}` : ''}</p>
                            <p className="text-[11px] text-gray-400">{g.adults || 1} adulte(s){g.children > 0 ? ` · ${g.children} enfant(s)` : ''} · {g.table_number ? g.table_number : 'Sans table'}{g.checked_in_at ? ' · En salle' : ''}</p>
                            </div>
                            <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(g.status)}`}>
                              {statusLabel(g.status)}
                            </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
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
                                    w.document.write(`<title>Entrée - ${safe(g.name)}</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;font-family:sans-serif}</style><div style="text-align:center"><img src="${src}" style="width:280px;height:280px"><p style="margin-top:16px;font-size:18px;color:#111"><strong>${safe(g.name)}</strong></p><p style="font-size:14px;color:#2563eb">${safe(tableLine)}</p><p style="font-size:12px;color:#666;margin-top:8px">Code d'entrée — à scanner à l'accueil</p></div>`);
                                  });
                                }}
                                title="QR d'entrée"
                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition text-xs"><QrCode className="w-3.5 h-3.5" /></button>
                              {g.phone && (
                                <a href={`https://wa.me/${g.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waTemplate.replace('{nom}', g.name).replace('{lien}', personalLink(g)))}`}
                                  target="_blank" rel="noopener" title="WhatsApp"
                                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition text-xs"><MessageCircle className="w-3.5 h-3.5" /></a>
                              )}
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
            <div className="flex flex-wrap gap-2">
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Table réservée</label>
                <input value={editingGuest.table_number || ''} onChange={(e) => setEditingGuest({ ...editingGuest, table_number: e.target.value || undefined })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Ex: Table 12" />
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