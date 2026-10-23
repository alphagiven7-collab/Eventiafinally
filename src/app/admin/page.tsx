'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { emptyGuestTotals, loadGuestTotalsByEvent, type GuestTotals } from '@/lib/admin/session';

export default function AdminHomePage() {
  const [accounts, setAccounts] = useState(0);
  const [events, setEvents] = useState(0);
  const [published, setPublished] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [guests, setGuests] = useState<GuestTotals>(emptyGuestTotals());

  useEffect(() => {
    if (!isSupabaseReady()) return;
    const supabase = createClient();
    void supabase.from('users').select('id', { count: 'exact', head: true }).then(({ count }) => setAccounts(count ?? 0));
    void supabase.from('events').select('is_published, is_blocked').then(({ data }) => {
      const rows = data || [];
      setEvents(rows.length);
      setPublished(rows.filter((row) => row.is_published && !row.is_blocked).length);
      setBlocked(rows.filter((row) => row.is_blocked).length);
    });
    void loadGuestTotalsByEvent().then((byEvent) => {
      const total = Object.values(byEvent).reduce((sum, row) => ({
        sent: sum.sent + row.sent,
        confirmed: sum.confirmed + row.confirmed,
        pending: sum.pending + row.pending,
        declined: sum.declined + row.declined,
      }), emptyGuestTotals());
      setGuests(total);
    });
  }, []);

  return (
    <div style={{ maxWidth: 980 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>Administration</Typography.Title>
      <Typography.Paragraph type="secondary">
        Vous gérez tous les comptes, toutes les invitations et tous les invités.
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8}>
          <Link href="/admin/comptes"><Card hoverable><Statistic title="Comptes" value={accounts} /></Card></Link>
        </Col>
        <Col xs={12} sm={8}>
          <Link href="/admin/evenements"><Card hoverable><Statistic title="Mariages" value={events} /></Card></Link>
        </Col>
        <Col xs={12} sm={8}>
          <Link href="/admin/evenements"><Card hoverable><Statistic title="Publiés" value={published} /></Card></Link>
        </Col>
        <Col xs={12} sm={8}>
          <Card><Statistic title="Bloqués" value={blocked} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card><Statistic title="Invitations envoyées" value={guests.sent} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card><Statistic title="Confirmées" value={guests.confirmed} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card><Statistic title="En attente" value={guests.pending} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card><Statistic title="Refusées" value={guests.declined} /></Card>
        </Col>
      </Row>
    </div>
  );
}
