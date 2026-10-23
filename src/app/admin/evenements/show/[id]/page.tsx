'use client';

import { useShow } from '@refinedev/core';
import { Button, Card, Input, InputNumber, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';
import { formatUsd, GUEST_PACKS, guestCapacity, packTotalUsd } from '@/constants/pricing';
import { emptyGuestTotals, loadGuestTotalsByEvent, type GuestTotals } from '@/lib/admin/session';

type EventRecord = {
  id: string;
  title?: string;
  slug?: string;
  user_id?: string;
  is_published?: boolean;
  guest_limit?: number | null;
  payment_note?: string | null;
};

export default function UnlockEventPage() {
  const { result, query } = useShow<EventRecord>({ resource: 'events' });
  const [count, setCount] = useState<number>(50);
  const [note, setNote] = useState('');
  const [owner, setOwner] = useState('');
  const [used, setUsed] = useState<number | null>(null);
  const [answers, setAnswers] = useState<GuestTotals>(emptyGuestTotals());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!result?.id || !isSupabaseReady()) return;
    const supabase = createClient();
    if (result.user_id) {
      void supabase.from('users').select('email').eq('id', result.user_id).maybeSingle().then(({ data }) => {
        setOwner(data?.email || '');
      });
    }
    void supabase.from('guests').select('id', { count: 'exact', head: true }).eq('event_id', result.id).then(({ count: total }) => {
      setUsed(total ?? 0);
    });
    void loadGuestTotalsByEvent().then((rows) => {
      setAnswers(rows[result.id] || emptyGuestTotals());
    });
    if (typeof result.guest_limit === 'number' && result.guest_limit > 3) {
      setCount(result.guest_limit - 3);
    }
  }, [result?.id, result?.user_id, result?.guest_limit]);

  const totalPlaces = guestCapacity(count);
  const price = useMemo(() => formatUsd(packTotalUsd(count || 0)), [count]);

  const unlock = async () => {
    if (!result?.id || count == null || count < 0) {
      message.error('Indiquez le nombre d’invitations payées.');
      return;
    }
    if (!isSupabaseReady()) {
      message.error('La connexion à la base n’est pas prête.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const noteValue = note.trim() || null;
    const rpc = await supabase.rpc('admin_unlock_event', {
      p_event_id: result.id,
      p_guest_limit: totalPlaces,
      p_note: noteValue,
    });
    if (rpc.error && /INVALID_LIMIT/i.test(rpc.error.message)) {
      setSaving(false);
      message.error('Indiquez au moins une invitation payée.');
      return;
    }
    let failed = Boolean(rpc.error);
    if (rpc.error && /function|schema cache|admin_unlock_event/i.test(rpc.error.message)) {
      const direct = await supabase
        .from('events')
        .update({ guest_limit: totalPlaces, payment_note: noteValue })
        .eq('id', result.id)
        .select('id, guest_limit');
      const retry = direct.error && /payment_note|schema cache|column/i.test(direct.error.message)
        ? await supabase.from('events').update({ guest_limit: totalPlaces }).eq('id', result.id).select('id, guest_limit')
        : direct;
      failed = Boolean(retry.error) || !retry.data?.length || retry.data[0]?.guest_limit !== totalPlaces;
    }
    setSaving(false);
    if (failed) {
      message.error('La limite n’a pas été enregistrée. Vérifiez vos droits d’administrateur.');
      return;
    }
    message.success(`${result.title || 'Invitation'} : ${totalPlaces} invitations débloquées.`);
    void query.refetch();
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/admin/evenements">Retour aux mariages</Link>
      <Typography.Title level={3}>Débloquer les invitations</Typography.Title>
      <Card loading={query.isLoading}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>{result?.title || 'Invitation'}</Typography.Title>
        <Typography.Paragraph>
          {owner || 'Organisateur'} · {result?.is_published ? 'Publiée' : 'Brouillon'}
          {used != null ? ` · ${used} invitation${used > 1 ? 's' : ''} envoyée${used > 1 ? 's' : ''}` : ''}
          {` · ${answers.confirmed} confirmée${answers.confirmed > 1 ? 's' : ''}`}
          {` · ${answers.pending} en attente`}
          {` · ${answers.declined} refusée${answers.declined > 1 ? 's' : ''}`}
          {typeof result?.guest_limit === 'number' ? ` · limite actuelle ${result.guest_limit}` : ''}
        </Typography.Paragraph>
        <Space wrap style={{ marginBottom: 16 }}>
          {result?.slug && <Link href={`/create/${result.slug}/edit?from=admin`}><Button>Modifier l’invitation</Button></Link>}
          {result?.id && <Link href={`/dashboard/invites?event=${encodeURIComponent(result.id)}`}><Button>Gérer les invités</Button></Link>}
          {result?.slug && <a href={`/e/${result.slug}`} target="_blank" rel="noreferrer"><Button>Ouvrir</Button></a>}
        </Space>
        <Space wrap>
          {GUEST_PACKS.map((pack) => (
            <Button key={pack} type={count === pack ? 'primary' : 'default'} onClick={() => setCount(pack)}>
              {pack} · {formatUsd(packTotalUsd(pack))}
            </Button>
          ))}
        </Space>
        <div style={{ marginTop: 16 }}>
          <Typography.Text>Autre nombre d’invitations payées</Typography.Text>
          <InputNumber min={0} max={5000} value={count} onChange={(value) => setCount(value ?? 0)} style={{ width: '100%', marginTop: 8 }} />
        </div>
        <Typography.Paragraph style={{ marginTop: 16 }}>
          <strong>{count || 0} invitations payées + 3 d’essai = {totalPlaces} invitations.</strong>
          <br />
          Total à encaisser : {price}.
        </Typography.Paragraph>
        <Input.TextArea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Note : virement, espèces, date…"
          rows={3}
        />
        <Button type="primary" size="large" block style={{ marginTop: 16 }} loading={saving} onClick={() => void unlock()}>
          Débloquer {totalPlaces} invitations
        </Button>
      </Card>
    </div>
  );
}
