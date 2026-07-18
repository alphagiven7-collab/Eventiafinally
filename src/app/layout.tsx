import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import SupabaseProvider from '@/providers/auth-provider';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Invitia - Créez vos invitations en ligne',
    template: '%s | Invitia',
  },
  description: 'Plateforme de création d\'invitations numériques pour événements. Mariages, anniversaires, baby showers et plus encore.',
  keywords: ['invitation', 'événement', 'mariage', 'anniversaire', 'RSVP', 'WhatsApp'],
  authors: [{ name: 'Invitia' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Invitia',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#D4AF37',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`h-full ${playfair.variable} ${cormorant.variable} ${inter.variable}`}>
      <body className="h-full antialiased flex flex-col bg-gray-50 dark:bg-gray-900">
        <SupabaseProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
