'use client';

import { List, useTable } from '@refinedev/antd';
import { Select, Table, message } from 'antd';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';

type Account = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  created_at?: string | null;
};

export default function AccountsPage() {
  const { tableProps, tableQuery } = useTable<Account>({
    resource: 'users',
    syncWithLocation: false,
    meta: { select: 'id, email, full_name, role, created_at' },
  });

  const changeRole = async (id: string, role: string) => {
    if (!isSupabaseReady()) {
      message.error('La connexion à la base n’est pas prête.');
      return;
    }
    const { error } = await createClient().from('users').update({ role }).eq('id', id);
    if (error) {
      message.error('Le rôle n’a pas été enregistré. Relancez le script d’accès dans Supabase.');
      return;
    }
    message.success('Rôle enregistré.');
    void tableQuery.refetch();
  };

  return (
    <List title="Comptes">
      <Table {...tableProps} rowKey="id" scroll={{ x: 520 }}>
        <Table.Column<Account>
          dataIndex="full_name"
          title="Nom"
          render={(value, record) => (
            <span style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
              <span>{value || 'Sans nom'}</span>
              <Select
                value={record.role || 'organizer'}
                style={{ minWidth: 150 }}
                onChange={(role) => void changeRole(record.id, role)}
                options={[
                  { value: 'organizer', label: 'Organisateur' },
                  { value: 'super_admin', label: 'Admin' },
                ]}
              />
            </span>
          )}
        />
        <Table.Column<Account> dataIndex="email" title="E-mail" render={(value) => value || '—'} />
        <Table.Column<Account>
          dataIndex="created_at"
          title="Inscription"
          render={(value: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '—'}
        />
      </Table>
    </List>
  );
}
