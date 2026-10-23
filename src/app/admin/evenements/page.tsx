'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Dropdown, Input, Modal, Segmented, Select, Switch, Table, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { publishInvitation, setGalleryVisibility } from '@/lib/events/store';
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
  show_in_gallery?: boolean | null;
};

type Account = { id: string; email?: string | null; full_name?: string | null };
type Filter = 'tous' | 'publie' | 'brouillon' | 'bloque';

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
  if (event.is_blocked) return <Tag color="red" style={{ margin: 0 }}>Bloqué</Tag>;
  if (event.is_published) return <Tag color="green" style={{ margin: 0 }}>Publiée</Tag>;
  return <Tag color="gold" style={{ margin: 0 }}>Brouillon</Tag>;
}

function statusOf(event: EventRow): Filter {
  if (event.is_blocked) return 'bloque';
  return event.is_published ? 'publie' : 'brouillon';
}

function EventsView() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<Record<string, GuestTotals>>({});
  const [search, setSearch] = useState('');
  const initialFilter = params.get('filtre');
  const [filter, setFilter] = useState<Filter>(
    initialFilter === 'publie' || initialFilter === 'brouillon' || initialFilter === 'bloque' ? initialFilter : 'tous',
  );
  const [creating, setCreating] = useState(params.get('nouveau') === '1');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isSupabaseReady());

  const load = async () => {
    if (!isSupabaseReady()) return;
    const supabase = createClient();
    const withGallery = 'id, user_id, slug, title, event_date, location, is_published, is_blocked, guest_limit, show_in_gallery, created_at';
    const withoutGallery = 'id, user_id, slug, title, event_date, location, is_published, is_blocked, guest_limit, created_at';
    let eventResult: { data: unknown[] | null; error: unknown } = await supabase.from('events').select(withGallery).order('created_at', { ascending: false });
    if (eventResult.error) {
      eventResult = await supabase.from('events').select(withoutGallery).order('created_at', { ascending: false });
    }
    const [accountResult, guestTotals] = await Promise.all([
      supabase.from('users').select('id, email, full_name').order('created_at', { ascending: false }),
      loadGuestTotalsByEvent(),
    ]);
    setEvents((eventResult.data || []) as EventRow[]);
    setAccounts((accountResult.data || []) as Account[]);
    setTotals(guestTotals);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const ownerOf = (userId?: string | null) => {
    const account = accounts.find((item) => item.id === userId);
    return { name: account?.full_name || account?.email || '—', email: account?.email || '' };
  };

  const counts = useMemo(() => ({
    tous: events.length,
    publie: events.filter((e) => statusOf(e) === 'publie').length,
    brouillon: events.filter((e) => statusOf(e) === 'brouillon').length,
    bloque: events.filter((e) => statusOf(e) === 'bloque').length,
  }), [events]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (filter !== 'tous' && statusOf(event) !== filter) return false;
      if (!query) return true;
      const owner = ownerOf(event.user_id);
      return [event.title, event.slug, event.location, owner.name, owner.email].some((value) => (value || '').toLowerCase().includes(query));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, search, filter, accounts]);

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

  const toggleGallery = async (event: EventRow, visible: boolean) => {
    const result = await setGalleryVisibility(createClient(), event.id, visible);
    if (result.error) {
      message.error(result.error);
      return;
    }
    setEvents((current) => current.map((item) => item.id === event.id ? { ...item, show_in_gallery: visible } : item));
  };

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

  const menuFor = (event: EventRow): MenuProps['items'] => [
    ...(event.slug ? [{ key: 'open', icon: <EyeOutlined />, label: <a href={`/e/${event.slug}`} target="_blank" rel="noreferrer">Ouvrir l’invitation</a> }] : []),
    { key: 'seats', icon: <AppstoreOutlined />, label: <Link href={`/admin/evenements/show/${event.id}`}>Places et paiement</Link> },
    { type: 'divider' },
    {
      key: 'publish',
      icon: <EyeOutlined />,
      label: event.is_published ? 'Remettre en brouillon' : 'Publier',
      onClick: () => void setPublished(event, !event.is_published),
    },
    {
      key: 'block',
      icon: event.is_blocked ? <UnlockOutlined /> : <LockOutlined />,
      label: event.is_blocked ? 'Rendre accessible' : 'Bloquer',
      onClick: () => void setBlocked(event, !event.is_blocked),
    },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => removeEvent(event) },
  ];

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Mariages</Typography.Title>
          <Typography.Text type="secondary">
            {summary.sent} invitations envoyées · {summary.confirmed} confirmées · {summary.pending} en attente · {summary.declined} refusées
          </Typography.Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} style={{ borderRadius: 12 }} onClick={() => setCreating((open) => !open)}>
          Nouvelle invitation
        </Button>
      </div>

      {creating && (
        <Card title="Créer une invitation" style={{ borderRadius: 16 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Input size="large" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nom du mariage" />
            <Input size="large" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <Input size="large" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lieu" />
            <Select
              size="large"
              value={ownerId || user?.id}
              onChange={setOwnerId}
              showSearch
              optionFilterProp="label"
              options={[
                ...(user?.id ? [{ value: user.id, label: 'Mon compte admin' }] : []),
                ...accounts.filter((account) => account.id !== user?.id).map((account) => ({
                  value: account.id,
                  label: account.full_name || account.email || account.id,
                })),
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button type="primary" loading={busy} onClick={() => void createEvent()}>Créer et modifier</Button>
            <Button onClick={() => setCreating(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'tous', label: `Tous · ${counts.tous}` },
            { value: 'publie', label: `Publiés · ${counts.publie}` },
            { value: 'brouillon', label: `Brouillons · ${counts.brouillon}` },
            { value: 'bloque', label: `Bloqués · ${counts.bloque}` },
          ]}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nom, lieu ou organisateur"
          style={{ maxWidth: 320, borderRadius: 10 }}
        />
      </div>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<EventRow>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
          scroll={{ x: 880 }}
          locale={{ emptyText: 'Aucun mariage.' }}
          columns={[
            {
              title: 'Mariage',
              key: 'title',
              render: (_, event) => (
                <div style={{ display: 'grid', gap: 2, minWidth: 180 }}>
                  <Typography.Text strong>{event.title || 'Sans titre'}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {[event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR') : '', event.location].filter(Boolean).join(' · ') || '—'}
                  </Typography.Text>
                </div>
              ),
            },
            {
              title: 'Organisateur',
              key: 'owner',
              render: (_, event) => {
                const owner = ownerOf(event.user_id);
                return (
                  <div style={{ display: 'grid', gap: 2 }}>
                    <Typography.Text>{owner.name}</Typography.Text>
                    {owner.email && owner.email !== owner.name && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{owner.email}</Typography.Text>}
                  </div>
                );
              },
            },
            { title: 'Statut', key: 'status', width: 110, render: (_, event) => statusTag(event) },
            {
              title: 'Invités',
              key: 'guests',
              width: 190,
              render: (_, event) => {
                const numbers = totals[event.id] || emptyGuestTotals();
                return (
                  <div style={{ display: 'grid', gap: 2 }}>
                    <Typography.Text strong>{numbers.sent} <Typography.Text type="secondary" style={{ fontWeight: 400 }}>/ {event.guest_limit ?? 3}</Typography.Text></Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {numbers.confirmed} oui · {numbers.pending} attente · {numbers.declined} non
                    </Typography.Text>
                  </div>
                );
              },
            },
            {
              title: 'Galerie',
              key: 'gallery',
              width: 90,
              align: 'center',
              render: (_, event) => (
                <Switch
                  size="small"
                  checked={Boolean(event.show_in_gallery)}
                  disabled={!event.is_published || event.is_blocked === true}
                  onChange={(checked) => void toggleGallery(event, checked)}
                />
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 150,
              align: 'right',
              render: (_, event) => (
                <div style={{ display: 'inline-flex', gap: 8 }}>
                  {event.slug && (
                    <Link href={`/create/${event.slug}/edit?from=admin`}>
                      <Button size="small" type="primary" icon={<EditOutlined />}>Modifier</Button>
                    </Link>
                  )}
                  <Link href={`/dashboard/invites?event=${encodeURIComponent(event.id)}`}>
                    <Button size="small" icon={<TeamOutlined />} aria-label="Invités" />
                  </Link>
                  <Dropdown menu={{ items: menuFor(event) }} trigger={['click']} disabled={busy}>
                    <Button size="small" icon={<MoreOutlined />} aria-label="Plus d’actions" />
                  </Dropdown>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsView />
    </Suspense>
  );
}
