'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal, Select, Space, Tag, Typography, message } from 'antd';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { publishInvitation } from '@/lib/events/store';
import { useAuth } from '@/providers/auth-provider';
import { emptyGuestTotals, loadGuestTotalsByEvent, type GuestTotals } from '@/lib/admin/session';
import type { EventWithSettings } from '@/types';

type EventRow = {
  id: string;
  title?: string | null;
  slug?: string | null;
  user_id?: string | null;
  event_date?: string | null;
  location?: string | null;
  is_published?: boolean | null;
  is_blocked?: boolean | null;
  guest_limit?: number | null;
};

type Account = { id: string; email?: string | null; full_name?: string | null };

function slugFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'invitation';
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

function statusTag(event: EventRow) {
  if (event.is_blocked) return <Tag color="red">Bloqué</Tag>;
  if (event.is_published) return <Tag color="green">Publiée</Tag>;
  return <Tag color="gold">Brouillon</Tag>;
}

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<Record<string, GuestTotals>>({});
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!isSupabaseReady()) return;
    const supabase = createClient();
    const [eventResult, accountResult, guestTotals] = await Promise.all([
      supabase
        .from('events')
        .select('id, user_id, slug, title, event_date, location, is_published, is_blocked, guest_limit, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('users').select('id, email, full_name').order('created_at', { ascending: false }),
      loadGuestTotalsByEvent(),
    ]);
    setEvents((eventResult.data || []) as EventRow[]);
    setAccounts((accountResult.data || []) as Account[]);
    setTotals(guestTotals);
  };

  useEffect(() => { void load(); }, []);

  const emailOf = (userId?: string | null) => {
    const account = accounts.find((item) => item.id === userId);
    return account?.full_name || account?.email || '—';
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) => {
      const owner = emailOf(event.user_id).toLowerCase();
      return [event.title, event.slug, event.location, owner].some((value) => (value || '').toLowerCase().includes(query));
    });
  }, [events, search, accounts]);

  const summary = filtered.reduce((sum, event) => {
    const row = totals[event.id] || emptyGuestTotals();
    return {
      sent: sum.sent + row.sent,
      confirmed: sum.confirmed + row.confirmed,
      pending: sum.pending + row.pending,
      declined: sum.declined + row.declined,
    };
  }, emptyGuestTotals());

  const run = async (action: () => Promise<{ error: { message: string } | null }>, success: string) => {
    if (!isSupabaseReady()) {
      message.error('La connexion à la base n’est pas prête.');
      return;
    }
    setBusy(true);
    const { error } = await action();
    setBusy(false);
    if (error) {
      message.error('Action refusée. Ouvrez Supabase, SQL Editor, et lancez le script d’accès admin.');
      return;
    }
    message.success(success);
    await load();
  };

  const createEvent = async () => {
    const name = title.trim();
    if (!name) {
      message.error('Le nom du mariage est obligatoire.');
      return;
    }
    if (!user?.id) {
      message.error('Reconnectez-vous.');
      return;
    }
    const slug = slugFromTitle(name);
    const eventDate = date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString();
    const draft: EventWithSettings = {
      id: crypto.randomUUID(),
      slug,
      title: name,
      user_id: ownerId || user.id,
      type: 'wedding',
      event_date: eventDate,
      location: location.trim() || 'Lieu à préciser',
      is_published: false,
      guestLimit: 3,
      invitationTemplate: 'ecran',
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBusy(true);
    const result = await publishInvitation(createClient(), draft);
    setBusy(false);
    if (result.error) {
      message.error(result.error);
      return;
    }
    message.success('Invitation créée.');
    router.push(`/create/${slug}/edit?from=admin`);
  };

  const setPublished = (event: EventRow, published: boolean) => run(async () => {
    const result = await createClient().from('events').update({ is_published: published }).eq('id', event.id).select('id');
    if (result.error || !result.data?.length) return { error: result.error || { message: 'empty' } };
    return { error: null };
  }, published ? 'Invitation publiée.' : 'Invitation remise en brouillon.');

  const setBlocked = (event: EventRow, blocked: boolean) => run(async () => {
    const rpc = await createClient().rpc('admin_set_event_blocked', { p_event_id: event.id, p_blocked: blocked });
    if (!rpc.error) return { error: null };
    if (!/function|schema cache|admin_set_event_blocked/i.test(rpc.error.message)) return { error: rpc.error };
    const direct = await createClient().from('events').update({ is_blocked: blocked }).eq('id', event.id).select('id');
    if (direct.error || !direct.data?.length) return { error: direct.error || { message: 'empty' } };
    return { error: null };
  }, blocked ? 'Invitation bloquée.' : 'Invitation de nouveau accessible.');

  const removeEvent = (event: EventRow) => {
    Modal.confirm({
      title: 'Supprimer ce mariage ?',
      content: `${event.title || 'Invitation'}, ses invités et ses réponses seront retirés.`,
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: () => run(async () => {
        const rpc = await createClient().rpc('admin_delete_event', { p_event_id: event.id });
        if (!rpc.error) return { error: null };
        if (!/function|schema cache|admin_delete_event/i.test(rpc.error.message)) return { error: rpc.error };
        const direct = await createClient().from('events').delete().eq('id', event.id).select('id');
        if (direct.error || !direct.data?.length) return { error: direct.error || { message: 'empty' } };
        return { error: null };
      }, 'Mariage supprimé.'),
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Mariages</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            {summary.sent} invitations envoyées · {summary.confirmed} confirmées · {summary.pending} en attente · {summary.declined} refusées
          </Typography.Paragraph>
        </div>
        <Button type="primary" onClick={() => setCreating((open) => !open)}>Nouvelle invitation</Button>
      </div>

      {creating && (
        <Card title="Créer une invitation">
          <div style={{ display: 'grid', gap: 12 }}>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nom du mariage" />
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lieu" />
            <Select
              value={ownerId || user?.id}
              onChange={setOwnerId}
              options={[
                ...(user?.id ? [{ value: user.id, label: 'Mon compte admin' }] : []),
                ...accounts.filter((account) => account.id !== user?.id).map((account) => ({
                  value: account.id,
                  label: account.full_name || account.email || account.id,
                })),
              ]}
            />
            <Button type="primary" loading={busy} onClick={() => void createEvent()}>Créer et modifier</Button>
          </div>
        </Card>
      )}

      <Input.Search value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, lieu ou organisateur" allowClear />

      {filtered.map((event) => {
        const numbers = totals[event.id] || emptyGuestTotals();
        return (
          <Card key={event.id} title={event.title || 'Sans titre'} extra={statusTag(event)}>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {emailOf(event.user_id)}
              {event.event_date ? ` · ${new Date(event.event_date).toLocaleDateString('fr-FR')}` : ''}
              {event.location ? ` · ${event.location}` : ''}
              {` · ${event.guest_limit ?? 3} places`}
            </Typography.Paragraph>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              <Tag>{numbers.sent} envoyées</Tag>
              <Tag color="green">{numbers.confirmed} confirmées</Tag>
              <Tag color="gold">{numbers.pending} en attente</Tag>
              <Tag>{numbers.declined} refusées</Tag>
            </Space>
            <Space wrap>
              {event.slug && <Link href={`/create/${event.slug}/edit?from=admin`}><Button type="primary" size="small">Modifier</Button></Link>}
              <Link href={`/dashboard/invites?event=${encodeURIComponent(event.id)}`}><Button size="small">Invités</Button></Link>
              <Link href={`/admin/evenements/show/${event.id}`}><Button size="small">Places</Button></Link>
              {event.slug && <a href={`/e/${event.slug}`} target="_blank" rel="noreferrer"><Button size="small">Ouvrir</Button></a>}
              <Button size="small" disabled={busy} onClick={() => setPublished(event, !event.is_published)}>
                {event.is_published ? 'Dépublier' : 'Publier'}
              </Button>
              <Button size="small" disabled={busy} onClick={() => setBlocked(event, !event.is_blocked)}>
                {event.is_blocked ? 'Rendre accessible' : 'Bloquer'}
              </Button>
              <Button size="small" danger disabled={busy} onClick={() => removeEvent(event)}>Supprimer</Button>
            </Space>
          </Card>
        );
      })}
      {!filtered.length && <Typography.Paragraph type="secondary">Aucun mariage.</Typography.Paragraph>}
    </div>
  );
}
