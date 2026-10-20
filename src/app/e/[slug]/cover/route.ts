import { fetchShareImageSource } from '@/lib/events/store';
import { createPublicClient } from '@/lib/supabase/public';
import { getEventBySlug } from '@/data/events';
import { firstCoverSource } from '@/lib/events/share-image';
import { toShareJpeg } from '@/lib/events/cover-jpeg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decodeDataImage(source: string): { bytes: Buffer; type: string } | null {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(source);
  if (!match) return null;
  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!bytes.byteLength) return null;
  return { bytes, type: match[1].toLowerCase() };
}

function jpegResponse(bytes: Buffer): Response {
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

async function asJpeg(bytes: Buffer, type: string, fallback: URL): Promise<Response> {
  try {
    return jpegResponse(await toShareJpeg(bytes, type));
  } catch {
    if (/png|jpe?g/i.test(type)) {
      return new Response(new Uint8Array(bytes), {
        headers: {
          'Content-Type': type,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    return Response.redirect(fallback, 307);
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const card = new URL(`/e/${slug}/share-image`, request.url);
  const supabase = createPublicClient();
  const hosted = supabase ? await fetchShareImageSource(supabase, slug) : '';
  const source = hosted || firstCoverSource(getEventBySlug(slug));
  if (!source) return Response.redirect(card, 307);

  if (/^https:\/\//i.test(source)) {
    if (/\.(?:jpe?g|png)(?:$|\?)/i.test(source)) return Response.redirect(source, 307);
    try {
      const remote = await fetch(source);
      if (!remote.ok) return Response.redirect(source, 307);
      const type = remote.headers.get('content-type') || '';
      const bytes = Buffer.from(await remote.arrayBuffer());
      if (!bytes.byteLength) return Response.redirect(source, 307);
      if (/webp/i.test(type) || !/png|jpe?g/i.test(type)) return asJpeg(bytes, type || 'image/webp', card);
      return Response.redirect(source, 307);
    } catch {
      return Response.redirect(source, 307);
    }
  }

  const decoded = decodeDataImage(source);
  if (!decoded) return Response.redirect(card, 307);
  return asJpeg(decoded.bytes, decoded.type, card);
}
