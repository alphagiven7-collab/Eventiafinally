import { Metadata } from 'next';
import { readPublicInvitation } from '@/lib/events/read-public';

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

  const rawImage = event.bestPhotos?.[0] || event.cover_image || event.branding?.ogShareImage || event.branding?.heroImage || '';
  const image = rawImage.startsWith('http') ? rawImage : '';
  const title = `${event.title} | Eventia`;
  const description = event.metaDescription || event.welcomeMessage || `Découvrez l'invitation de ${event.title} sur Eventia.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Eventia',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
    other: {
      'whatsapp:title': title,
      'whatsapp:description': description,
      ...(image ? { 'whatsapp:image': image } : {}),
    },
  };
}

export default function EventLayout({ children }: Props) {
  return <>{children}</>;
}