import { ImageResponse } from 'next/og';
import { readPublicInvitation } from '@/lib/events/read-public';
import { shareDescription, shareTitle } from '@/lib/events/share-image';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const event = await readPublicInvitation(slug);
  const title = (event?.title || 'Invitation').slice(0, 80);
  const description = shareDescription(event).slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #5b21b6 0%, #2563eb 100%)',
          color: 'white',
          padding: '64px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 2 }}>EVENTIA</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 28, opacity: 0.92 }}>{description}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 22 }}>{shareTitle(event)}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
