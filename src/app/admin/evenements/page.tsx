'use client';

import { List, useTable } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Button, Modal, Table, Tag, message } from 'antd';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';

type EventRow = {
  id: string;
  title?: string;
  slug?: string;
  user_id?: string;
  event_date?: string | null;
  location?: string | null;
  is_published?: boolean;
  is_blocked?: boolean | null;
  guest_limit?: number | null;
};

type Account = { id: string; email?: string | null };

export default function EventsPage() {
  const { tableProps } = useTable<EventRow>({
    resource: 'events',
    syncWithLocation: false,
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
    meta: { select: 'id, user_id, slug, title, event_date, location, is_published, is_blocked, guest_limit, created_at' },
  });
  const accounts = useList<Account>({
    resource: 'users',
    pagination: { pageSize: 100 },
    meta: { select: 'id, email' },
  });
  const emailOf = (userId?: string) => accounts.result?.data?.find((account) => account.id === userId)?.email;

  const runAdmin = async (call: () => Promise<{ error: { message: string } | null }>) => {
    if (!isSupabaseReady()) {
      message.error('La connexion à la base n’est pas prête.');
      return;
    }
    const { error } = await call();
    if (error) {
      message.error('Action refusée. Relancez le script d’accès dans Supabase.');
      return;
    }
    message.success('Modification enregistrée.');
    window.location.reload();
  };

  const setBlocked = (record: EventRow, blocked: boolean) => {
    void runAdmin(async () => {
      const rpc = await createClient().rpc('admin_set_event_blocked', {
        p_event_id: record.id,
        p_blocked: blocked,
      });
      if (!rpc.error) return { error: null };
      if (!/function|schema cache|admin_set_event_blocked/i.test(rpc.error.message)) return { error: rpc.error };
      const direct = await createClient().from('events').update({ is_blocked: blocked }).eq('id', record.id).select('id');
      if (direct.error || !direct.data?.length) return { error: direct.error || { message: 'empty' } };
      return { error: null };
    });
  };

  const removeEvent = (record: EventRow) => {
    Modal.confirm({
      title: 'Supprimer cet événement ?',
      content: `${record.title || 'Invitation'} et ses invités seront retirés.`,
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: () => runAdmin(async () => {
        const rpc = await createClient().rpc('admin_delete_event', { p_event_id: record.id });
        if (!rpc.error) return { error: null };
        if (!/function|schema cache|admin_delete_event/i.test(rpc.error.message)) return { error: rpc.error };
        const direct = await createClient().from('events').delete().eq('id', record.id).select('id');
        if (direct.error || !direct.data?.length) return { error: direct.error || { message: 'empty' } };
        return { error: null };
      }),
    });
  };

  return (
    <List title="Événements">
      <Table {...tableProps} rowKey="id" scroll={{ x: 640 }}>
        <Table.Column<EventRow>
          dataIndex="title"
          title="Invitation"
          render={(value, record) => (
            <span style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
              <span>{value || 'Sans titre'}</span>
              <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/admin/evenements/show/${record.id}`}>
                  <Button type="primary" size="small">Débloquer</Button>
                </Link>
                {record.slug && (
                  <Link href={`/create/${record.slug}/edit`}>
                    <Button size="small">Modifier</Button>
                  </Link>
                )}
                <Button size="small" onClick={() => setBlocked(record, !record.is_blocked)}>
                  {record.is_blocked ? 'Rendre accessible' : 'Bloquer'}
                </Button>
                <Button size="small" danger onClick={() => removeEvent(record)}>Supprimer</Button>
              </span>
            </span>
          )}
        />
        <Table.Column<EventRow> dataIndex="user_id" title="Organisateur" render={(value) => emailOf(value) || '—'} />
        <Table.Column<EventRow>
          dataIndex="is_published"
          title="Statut"
          render={(value: boolean, record: EventRow) => (
            record.is_blocked
              ? <Tag color="red">Bloqué</Tag>
              : <Tag color={value ? 'green' : 'gold'}>{value ? 'Publiée' : 'Brouillon'}</Tag>
          )}
        />
        <Table.Column<EventRow>
          dataIndex="guest_limit"
          title="Places"
          render={(value: number | null) => value ?? 3}
        />
        <Table.Column<EventRow>
          dataIndex="event_date"
          title="Date"
          render={(value: string | null) => value ? new Date(value).toLocaleDateString('fr-FR') : '—'}
        />
        <Table.Column<EventRow>
          title=""
          render={(_, record) => record.slug ? (
            <a href={`/e/${record.slug}`} target="_blank" rel="noreferrer">Ouvrir</a>
          ) : null}
        />
      </Table>
    </List>
  );
}
