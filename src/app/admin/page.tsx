'use client';

import { useList } from '@refinedev/core';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import Link from 'next/link';

export default function AdminHomePage() {
  const users = useList({ resource: 'users', pagination: { pageSize: 1 } });
  const events = useList({ resource: 'events', pagination: { pageSize: 1 } });

  return (
    <div style={{ maxWidth: 960 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>Administration</Typography.Title>
      <Typography.Paragraph type="secondary">
        Comptes, invitations et déblocage des places après un paiement.
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Link href="/admin/comptes">
            <Card hoverable>
              <Statistic title="Comptes" value={users.result?.total ?? 0} />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12}>
          <Link href="/admin/evenements">
            <Card hoverable>
              <Statistic title="Événements" value={events.result?.total ?? 0} />
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
}
