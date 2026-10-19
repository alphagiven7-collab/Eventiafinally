import { Metadata } from 'next';
import { readPublicInvitation } from '@/lib/events/read-public';
import { publicCoverUrl, shareDescription, shareTitle } from '@/lib/events/share-image';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await readPublicInvitation(slug);

  if (!event) {
    return {
      title: 'Invitation introuvable | Eventia',
      description: 'Cette invitation n\'existe pas ou a été supprimée.',
    };
  }

  const photo = publicCoverUrl(event, slug);
  const image = photo || `/e/${slug}/share-image`;
  const title = shareTitle(event);
  const description = shareDescription(event);

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: event.title || 'Invitation Eventia' }],
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Eventia',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function EventLayout({ children }: Props) {
  return <>{children}</>;
}