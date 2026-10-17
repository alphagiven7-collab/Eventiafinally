'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui';
import { EventWithSettings, Guest, GuestStatus } from '@/types';
import { listInvitations } from '@/lib/events/store';
import { addGuest, addGuests, deleteGuest, guestInvitePath, listGuests, updateGuest } from '@/lib/guests/store';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { FREE_GUEST_LIMIT } from '@/constants/pricing';
import { SUPABASE_REQUIRED } from '@/providers/auth-provider';

type Tab = 'overview' | 'guests' | 'rsvps' | 'exports';

function GuestManagementContent() {
  const router = useRouter();
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
        if (evts.length > 0) setSelectedEventId(evts[0].id);
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
  const filteredGuests = guests.filter(g => {
    if (filter !== 'all' && g.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.phone || '').includes(q) || (g.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const personalLink = (guest: Guest) => {
    const slug = events.find((event) => event.id === selectedEventId)?.slug || '';
    return `${window.location.origin}${guestInvitePath(slug, guest)}`;
  };

  // Ajouter un invité
  const handleAddGuest = async () => {
    if (!isSupabaseReady()) { addToast('error', SUPABASE_REQUIRED); return; }
    const result = await addGuest(createClient(), selectedEventId, {
      name: newName,
      phone: newPhone,
      email: newEmail,
      group: newGroup,
    });
    if (result.error || !result.guest) {
      addToast('error', result.error || 'Invité non enregistré');
      return;
    }
    setGuests((current) => [result.guest!, ...current]);
    setNewName(''); setNewPhone(''); setNewEmail(''); setNewGroup('');
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

  // Import CSV
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('nom') || header.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const newGuests: Guest[] = dataLines.map(line => {
      const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      return {
        id: 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        event_id: selectedEventId,
        name: parts[0] || 'Sans nom',
        phone: parts[1] || undefined,
        group: parts[2] || undefined,
        email: parts[3] || undefined,
        status: 'pending' as GuestStatus,
        adults: 1,
        children: 0,
        token: Math.random().toString(36).slice(2, 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }).filter(g => g.name !== 'Sans nom' || g.phone);

    if (!isSupabaseReady()) {
      addToast('error', SUPABASE_REQUIRED);
      e.target.value = '';
      return;
    }

    const result = await addGuests(createClient(), selectedEventId, newGuests.map((guest) => ({
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      group: guest.group,
    })));
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
    e.target.value = '';
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-rose-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-rose-500 font-medium uppercase tracking-wider">Administration</p>
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Gestion des invités</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/dashboard')} className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6 space-y-4">
        {/* Sélecteur événement */}
        {events.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Événement</label>
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              {events.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-700">
          {[
            { id: 'overview' as Tab, icon: '📊', label: 'Vue d\'ensemble' },
            { id: 'guests' as Tab, icon: '👥', label: 'Invités' },
            { id: 'rsvps' as Tab, icon: '✓', label: 'Confirmations' },
            { id: 'exports' as Tab, icon: '📥', label: 'Exports' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-medium transition ${activeTab === tab.id ? 'bg-rose-500 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <span className="mr-1">{tab.icon}</span> {tab.label}
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
              { label: 'Offre gratuite', value: `${Math.min(stats.total, FREE_GUEST_LIMIT)}/${FREE_GUEST_LIMIT}`, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">📥 Importer des invités</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Format CSV : <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">nom,telephone,groupe,email</code></p>
              <div className="flex flex-wrap gap-2">
                <label className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-medium cursor-pointer hover:bg-rose-600 transition">
                  Choisir un fichier CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                </label>
                <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  + Ajouter manuellement
                </button>
              </div>
            </div>

            {/* Formulaire ajout */}
            {showAddForm && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Ajouter un invité</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  Offre gratuite : {guests.length}/{FREE_GUEST_LIMIT} invités enregistrés. Chaque lien personnel s&apos;ouvre sur un autre téléphone.
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">💬 Message WhatsApp</h2>
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
                <p className="text-4xl mb-3">👥</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun invité. Importez un CSV ou ajoutez manuellement.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Invité</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Contact</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Groupe</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Statut</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuests.map(g => (
                        <tr key={g.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{g.name}</p>
                            <p className="text-[10px] text-gray-400">{g.adults || 1} ad. {g.children > 0 ? `· ${g.children} enf.` : ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">{g.phone || '—'}</p>
                            <p className="text-[10px] text-gray-400">{g.email || ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{g.group || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${statusColor(g.status)}`}>
                              {statusLabel(g.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              {g.status !== 'confirmed' && (
                                <button onClick={() => handleStatusChange(g.id, 'confirmed')} title="Confirmer"
                                  className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition text-xs">✅</button>
                              )}
                              {g.status !== 'declined' && (
                                <button onClick={() => handleStatusChange(g.id, 'declined')} title="Refuser"
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-xs">❌</button>
                              )}
                              <button onClick={() => setEditingGuest(g)} title="Modifier"
                                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition text-xs">✏️</button>
                              <button
                                onClick={() => {
                                  const link = personalLink(g);
                                  const canvas = document.createElement('canvas');
                                  const qrSize = 256;
                                  canvas.width = qrSize; canvas.height = qrSize;
                                  const ctx = canvas.getContext('2d');
                                  if (!ctx) return;
                                  // Dessiner un QR simple (matrix code via API Google Charts)
                                  const img = new Image();
                                  img.crossOrigin = 'anonymous';
                                  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(link)}`;
                                  img.onload = () => {
                                    ctx.drawImage(img, 0, 0);
                                    const w = window.open('', '_blank');
                                    if (w) {
                                      w.document.write(`<title>QR - ${g.name}</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;font-family:sans-serif}</style><div style="text-align:center"><img src="${canvas.toDataURL()}" style="max-width:300px"><p style="margin-top:16px;font-size:14px;color:#333"><strong>${g.name}</strong></p><p style="font-size:12px;color:#666">${link}</p><p style="font-size:11px;color:#999;margin-top:8px">Table: ${g.table_number || '—'}</p></div>`);
                                    }
                                  };
                                }}
                                title="QR Code"
                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition text-xs">🔲</button>
                              {g.phone && (
                                <a href={`https://wa.me/${g.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waTemplate.replace('{nom}', g.name).replace('{lien}', personalLink(g)))}`}
                                  target="_blank" rel="noopener" title="WhatsApp"
                                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition text-xs">💬</a>
                              )}
                              <button onClick={() => handleDelete(g.id)} title="Supprimer"
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-xs">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  <p className="text-4xl mb-3">✉️</p>
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
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">📥 Exporter les données</h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">Téléchargez vos listes pour archivage ou impression.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportCSV} className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-medium hover:bg-rose-600 transition">
                Export CSV
              </button>
              <button onClick={handleExportJSON} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Export JSON
              </button>
            </div>
          </div>
        )}
      </main>

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
    </div>
  );
}

export default function GuestManagementPage() {
  return (
    <ProtectedRoute>
      <GuestManagementContent />
    </ProtectedRoute>
  );
}