import { EventWithSettings } from '@/types';
import { fetchInvitationShell } from '@/lib/events/store';
import { createPublicClient } from '@/lib/supabase/public';
import InvitationView from './invitation-view';

export const revalidate = 60;

function paintShell(event: EventWithSettings, slug: string): EventWithSettings {
  const remote = /^https:\/\//i.test(event.cover_image || '') ? event.cover_image || '' : '';
  return {
    ...event,
    heroImage: remote || `/e/${slug}/cover`,
    hero_image: undefined,
    cover_image: remote || undefined,
    adminCode: undefined,
    user_id: undefined,
  };
}

export default async function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let initialEvent: EventWithSettings | null = null;
  const supabase = createPublicClient();
  if (supabase) {
    try {
      const shell = await fetchInvitationShell(supabase, slug);
      if (shell) initialEvent = paintShell(shell, slug);
    } catch {
      initialEvent = null;
    }
  }

  return (
    <InvitationView
      slug={slug}
      initialEvent={initialEvent}
      initialMediaDeferred={Boolean(initialEvent)}
    />
  );
}
