import { readPublicInvitation } from '@/lib/events/read-public';
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
  const event = await readPublicInvitation(slug);
  const source = firstCoverSource(event);
  if (!source) return new Response('Photo introuvable', { status: 404 });
  if (/^https:\/\//i.test(source)) return Response.redirect(source, 307);
  return imageFromDataUrl(source) ?? new Response('Photo introuvable', { status: 404 });
}
