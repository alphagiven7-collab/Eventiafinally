import { EventWithSettings } from '@/types';
import { fetchInvitationBySlug } from '@/lib/events/store';
import { createPublicClient } from '@/lib/supabase/public';
import InvitationView from './invitation-view';

export const revalidate = 60;

export default async function EventInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let initialEvent: EventWithSettings | null = null;
  const supabase = createPublicClient();
  if (supabase) {
    try {
      const hosted = await fetchInvitationBySlug(supabase, slug, { includeMusic: false });
      if (hosted) {
        delete hosted.adminCode;
        delete hosted.user_id;
        initialEvent = hosted;
      }
    } catch {
      initialEvent = null;
    }
  }

  return <InvitationView slug={slug} initialEvent={initialEvent} />;
}
