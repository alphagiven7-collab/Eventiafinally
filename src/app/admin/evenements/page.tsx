'use client';

import { List, useTable } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Button, Table, Tag } from 'antd';
import Link from 'next/link';

type EventRow = {
  id: string;
  title?: string;
  slug?: string;
  user_id?: string;
  event_date?: string | null;
  location?: string | null;
  is_published?: boolean;
  guest_limit?: number | null;
};

type Account = { id: string; email?: string | null };

export default function EventsPage() {
  const { tableProps } = useTable<EventRow>({
    resource: 'events',
    syncWithLocation: false,
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
    meta: { select: 'id, user_id, slug, title, event_date, location, is_published, guest_limit, created_at' },
  });
  const accounts = useList<Account>({
    resource: 'users',
    pagination: { pageSize: 100 },
    meta: { select: 'id, email' },
  });
  const emailOf = (userId?: string) => accounts.result?.data?.find((account) => account.id === userId)?.email;

  return (
    <List title="Événements">
      <Table {...tableProps} rowKey="id" scroll={{ x: 640 }}>
        <Table.Column<EventRow>
          dataIndex="title"
          title="Invitation"
          render={(value, record) => (
            <span style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
              <span>{value || 'Sans titre'}</span>
              <Link href={`/admin/evenements/show/${record.id}`}>
                <Button type="primary" size="small">Débloquer</Button>
              </Link>
            </span>
          )}
        />
        <Table.Column<EventRow> dataIndex="user_id" title="Organisateur" render={(value) => emailOf(value) || '—'} />
        <Table.Column<EventRow>
          dataIndex="is_published"
          title="Statut"
          render={(value: boolean) => (
            <Tag color={value ? 'green' : 'gold'}>{value ? 'Publiée' : 'Brouillon'}</Tag>
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
