'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Card, Input, Segmented, Select, Table, Tag, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';

type Account = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string | null;
};

type RoleFilter = 'tous' | 'organizer' | 'super_admin';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(isSupabaseReady());
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('tous');

  const load = async () => {
    if (!isSupabaseReady()) return;
    const supabase = createClient();
    const [accountResult, eventResult] = await Promise.all([
      supabase.from('users').select('id, email, full_name, phone, role, created_at').order('created_at', { ascending: false }),
      supabase.from('events').select('user_id'),
    ]);
    let rows = accountResult.data as Account[] | null;
    if (accountResult.error) {
      const fallback = await supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false });
      rows = fallback.data as Account[] | null;
    }
    const counts: Record<string, number> = {};
    for (const row of (eventResult.data || []) as { user_id: string | null }[]) {
      if (row.user_id) counts[row.user_id] = (counts[row.user_id] || 0) + 1;
    }
    setAccounts(rows || []);
    setEventCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const changeRole = async (id: string, next: string) => {
    if (!isSupabaseReady()) {
      message.error('La connexion à la base n’est pas prête.');
      return;
    }
    const { error } = await createClient().from('users').update({ role: next }).eq('id', id);
    if (error) {
      message.error('Le rôle n’a pas été enregistré. Vérifiez vos droits d’administrateur.');
      return;
    }
    message.success('Rôle enregistré.');
    setAccounts((current) => current.map((account) => account.id === id ? { ...account, role: next } : account));
  };

  const counts = useMemo(() => ({
    tous: accounts.length,
    organizer: accounts.filter((a) => a.role !== 'super_admin').length,
    super_admin: accounts.filter((a) => a.role === 'super_admin').length,
  }), [accounts]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const isAdmin = account.role === 'super_admin';
      if (role === 'super_admin' && !isAdmin) return false;
      if (role === 'organizer' && isAdmin) return false;
      if (!query) return true;
      return [account.full_name, account.email, account.phone].some((value) => (value || '').toLowerCase().includes(query));
    });
  }, [accounts, search, role]);

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 1100 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>Comptes</Typography.Title>
        <Typography.Text type="secondary">
          {accounts.length} compte{accounts.length > 1 ? 's' : ''} · {counts.super_admin} administrateur{counts.super_admin > 1 ? 's' : ''}
        </Typography.Text>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <Segmented<RoleFilter>
          value={role}
          onChange={setRole}
          options={[
            { value: 'tous', label: `Tous · ${counts.tous}` },
            { value: 'organizer', label: `Organisateurs · ${counts.organizer}` },
            { value: 'super_admin', label: `Admins · ${counts.super_admin}` },
          ]}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nom, e-mail ou téléphone"
          style={{ maxWidth: 320, borderRadius: 10 }}
        />
      </div>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<Account>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
          scroll={{ x: 720 }}
          locale={{ emptyText: 'Aucun compte.' }}
          columns={[
            {
              title: 'Compte',
              key: 'account',
              render: (_, account) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                  <Avatar style={{ background: account.role === 'super_admin' ? '#7c3aed' : '#2563eb', flexShrink: 0 }}>
                    {(account.full_name || account.email || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                    <Typography.Text strong>{account.full_name || 'Sans nom'}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{account.email || '—'}</Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Téléphone',
              dataIndex: 'phone',
              render: (value: string | null | undefined) => value || '—',
            },
            {
              title: 'Mariages',
              key: 'events',
              width: 100,
              align: 'center',
              render: (_, account) => <Tag color={eventCounts[account.id] ? 'blue' : 'default'} style={{ margin: 0 }}>{eventCounts[account.id] || 0}</Tag>,
            },
            {
              title: 'Inscription',
              dataIndex: 'created_at',
              width: 130,
              render: (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('fr-FR') : '—',
            },
            {
              title: 'Rôle',
              key: 'role',
              width: 170,
              render: (_, account) => (
                <Select
                  value={account.role || 'organizer'}
                  style={{ width: 150 }}
                  onChange={(next) => void changeRole(account.id, next)}
                  options={[
                    { value: 'organizer', label: 'Organisateur' },
                    { value: 'super_admin', label: 'Admin' },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
