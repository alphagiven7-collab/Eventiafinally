'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, Card, Progress, Skeleton, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { emptyGuestTotals, loadGuestTotalsByEvent, type GuestTotals } from '@/lib/admin/session';
import { TEAM_WHATSAPP_URL } from '@/constants/contact';

type EventLite = {
  id: string;
  title?: string | null;
  slug?: string | null;
  event_date?: string | null;
  location?: string | null;
  is_published?: boolean | null;
  is_blocked?: boolean | null;
  created_at?: string | null;
};

type AccountLite = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  created_at?: string | null;
};

const DAY = 86_400_000;

function relativeDay(value?: string | null): string {
  if (!value) return '—';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / DAY);
  if (days <= 0) return 'Aujourd’hui';
  if (days === 1) return 'Hier';
  if (days < 30) return `Il y a ${days} jours`;
  return new Date(value).toLocaleDateString('fr-FR');
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}

function Kpi({
  label,
  value,
  hint,
  icon,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone: string;
  href?: string;
}) {
  const body = (
    <Card hoverable={Boolean(href)} styles={{ body: { padding: 20 } }} style={{ height: '100%', borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{label}</Typography.Text>
          <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15, marginTop: 6 }}>{value}</div>
          {hint && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{hint}</Typography.Text>}
        </div>
        <span
          style={{
            display: 'inline-flex',
            width: 40,
            height: 40,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            fontSize: 18,
            color: tone,
            background: `${tone}1a`,
          }}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
  return href ? <Link href={href} style={{ display: 'block', height: '100%' }}>{body}</Link> : body;
}

export default function AdminHomePage() {
  const [loading, setLoading] = useState(isSupabaseReady());
  const [accounts, setAccounts] = useState<AccountLite[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [totals, setTotals] = useState<Record<string, GuestTotals>>({});

  useEffect(() => {
    if (!isSupabaseReady()) return;
    let cancelled = false;
    const supabase = createClient();
    void Promise.all([
      supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select('id, title, slug, event_date, location, is_published, is_blocked, created_at')
        .order('created_at', { ascending: false }),
      loadGuestTotalsByEvent(),
    ]).then(([accountResult, eventResult, byEvent]) => {
      if (cancelled) return;
      setAccounts((accountResult.data || []) as AccountLite[]);
      setEvents((eventResult.data || []) as EventLite[]);
      setTotals(byEvent);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const guests = useMemo(
    () => Object.values(totals).reduce((sum, row) => ({
      sent: sum.sent + row.sent,
      confirmed: sum.confirmed + row.confirmed,
      pending: sum.pending + row.pending,
      declined: sum.declined + row.declined,
    }), emptyGuestTotals()),
    [totals],
  );

  const stats = useMemo(() => {
    const now = new Date().getTime();
    const published = events.filter((e) => e.is_published && !e.is_blocked).length;
    const blocked = events.filter((e) => e.is_blocked).length;
    const drafts = events.filter((e) => !e.is_published && !e.is_blocked).length;
    const newAccounts = accounts.filter((a) => a.created_at && now - new Date(a.created_at).getTime() < 7 * DAY).length;
    const newEvents = events.filter((e) => e.created_at && now - new Date(e.created_at).getTime() < 7 * DAY).length;
    const upcoming = events
      .filter((e) => e.is_published && !e.is_blocked && e.event_date && new Date(e.event_date).getTime() >= now - DAY)
      .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
      .slice(0, 5);
    const idle = events.filter((e) => e.is_published && !e.is_blocked && (totals[e.id]?.sent ?? 0) === 0).length;
    return { published, blocked, drafts, newAccounts, newEvents, upcoming, idle };
  }, [events, accounts, totals]);

  const responseRate = guests.sent ? Math.round(((guests.confirmed + guests.declined) / guests.sent) * 100) : 0;
  const confirmRate = guests.sent ? Math.round((guests.confirmed / guests.sent) * 100) : 0;

  if (loading) {
    return (
      <div style={{ maxWidth: 1100 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, display: 'grid', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '24px 28px',
          borderRadius: 20,
          color: '#fff',
          background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 45%, #db2777 100%)',
        }}
      >
        <div>
          <Typography.Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
            CENTRE DE CONTRÔLE
          </Typography.Text>
          <Typography.Title level={3} style={{ color: '#fff', margin: '4px 0 6px' }}>L’état d’Eventia en un coup d’œil</Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,.85)' }}>
            Cette semaine : {plural(stats.newEvents, 'nouveau mariage', 'nouveaux mariages')} et {plural(stats.newAccounts, 'nouveau compte', 'nouveaux comptes')}.
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/admin/evenements?nouveau=1">
            <Button size="large" icon={<PlusOutlined />} style={{ borderRadius: 12, fontWeight: 600 }}>Nouvelle invitation</Button>
          </Link>
          <a href={TEAM_WHATSAPP_URL} target="_blank" rel="noreferrer">
            <Button size="large" ghost icon={<WhatsAppOutlined />} style={{ borderRadius: 12, fontWeight: 600 }}>WhatsApp</Button>
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <Kpi label="Comptes" value={accounts.length} hint={`+${stats.newAccounts} cette semaine`} icon={<UserOutlined />} tone="#7c3aed" href="/admin/comptes" />
        <Kpi label="Mariages" value={events.length} hint={plural(stats.drafts, 'brouillon', 'brouillons')} icon={<CalendarOutlined />} tone="#2563eb" href="/admin/evenements" />
        <Kpi label="Publiés" value={stats.published} hint={`${stats.idle} sans invité`} icon={<EyeOutlined />} tone="#059669" href="/admin/evenements" />
        <Kpi label="Invitations envoyées" value={guests.sent} hint={`${responseRate} % ont répondu`} icon={<SendOutlined />} tone="#db2777" />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card title="Réponses des invités" style={{ borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Progress
              type="circle"
              percent={confirmRate}
              size={120}
              strokeColor="#059669"
              format={(p) => <span style={{ fontSize: 22, fontWeight: 800 }}>{p} %</span>}
            />
            <div style={{ display: 'grid', gap: 12, flex: 1, minWidth: 180 }}>
              {[
                { label: 'Confirmées', value: guests.confirmed, icon: <CheckCircleOutlined />, color: '#059669' },
                { label: 'En attente', value: guests.pending, icon: <ClockCircleOutlined />, color: '#d97706' },
                { label: 'Refusées', value: guests.declined, icon: <CloseCircleOutlined />, color: '#dc2626' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: row.color, fontWeight: 600 }}>{row.icon}&nbsp; {row.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="À surveiller" style={{ borderRadius: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Brouillons non publiés', value: stats.drafts, color: 'gold', href: '/admin/evenements?filtre=brouillon', icon: <ClockCircleOutlined /> },
              { label: 'Publiés sans aucun invité', value: stats.idle, color: 'blue', href: '/admin/evenements?filtre=publie', icon: <TeamOutlined /> },
              { label: 'Mariages bloqués', value: stats.blocked, color: 'red', href: '/admin/evenements?filtre=bloque', icon: <StopOutlined /> },
            ].map((row) => (
              <Link
                key={row.label}
                href={row.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(124,58,237,.06)',
                  color: 'inherit',
                }}
              >
                <span>{row.icon}&nbsp; {row.label}</span>
                <Tag color={row.color} style={{ margin: 0, fontWeight: 700 }}>{row.value}</Tag>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card title="Prochains mariages" extra={<Link href="/admin/evenements">Tout voir</Link>} style={{ borderRadius: 16 }}>
          {stats.upcoming.length === 0 && <Typography.Text type="secondary">Aucun mariage publié à venir.</Typography.Text>}
          <div style={{ display: 'grid', gap: 4 }}>
            {stats.upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/admin/evenements/show/${event.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', color: 'inherit' }}
              >
                <div
                  style={{
                    width: 48,
                    flexShrink: 0,
                    textAlign: 'center',
                    borderRadius: 10,
                    padding: '6px 0',
                    background: 'rgba(124,58,237,.1)',
                    color: '#7c3aed',
                    lineHeight: 1.1,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{new Date(event.event_date!).getDate()}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                    {new Date(event.event_date!).toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title || 'Sans titre'}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {event.location || 'Lieu à préciser'} · {totals[event.id]?.sent ?? 0} invités
                  </Typography.Text>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Derniers comptes" extra={<Link href="/admin/comptes">Tout voir</Link>} style={{ borderRadius: 16 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            {accounts.slice(0, 5).map((account) => (
              <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px' }}>
                <Avatar style={{ background: '#7c3aed', flexShrink: 0 }}>
                  {(account.full_name || account.email || '?').charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {account.full_name || 'Sans nom'}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {account.email || '—'} · {relativeDay(account.created_at)}
                  </Typography.Text>
                </div>
                {account.role === 'super_admin' && <Tag color="purple" style={{ margin: 0 }}>Admin</Tag>}
              </div>
            ))}
            {accounts.length === 0 && <Typography.Text type="secondary">Aucun compte.</Typography.Text>}
          </div>
        </Card>
      </div>
    </div>
  );
}
