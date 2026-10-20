import { fetchInvitationBySlug, fetchInvitationMeta } from '@/lib/events/store';
import { createPublicClient } from '@/lib/supabase/public';
import { getEventBySlug } from '@/data/events';
import { firstCoverSource } from '@/lib/events/share-image';

export const runtime = 'nodejs';

function imageFromDataUrl(source: string): Response | null {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(source);
  if (!match) return null;
  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!bytes.byteLength) return null;
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': match[1].toLowerCase(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const supabase = createPublicClient();
  const meta = supabase ? await fetchInvitationMeta(supabase, slug) : null;
  if (meta?.coverUrl) return Response.redirect(meta.coverUrl, 307);
  const hosted = supabase ? await fetchInvitationBySlug(supabase, slug, { includeMusic: false }) : null;
  const source = firstCoverSource(hosted || getEventBySlug(slug));
  if (!source) return Response.redirect(new URL(`/e/${slug}/share-image`, _request.url), 307);
  if (/^https:\/\//i.test(source)) return Response.redirect(source, 307);
  return imageFromDataUrl(source) ?? Response.redirect(new URL(`/e/${slug}/share-image`, _request.url), 307);
}
