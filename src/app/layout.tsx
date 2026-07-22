import type { Metadata, Viewport } from 'next';
import '@/lib/polyfills';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import SupabaseProvider from '@/providers/auth-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { ToastProvider } from '@/components/ui/toast';
import { PWAActivator } from '@/providers/pwa-activator';

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
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased flex flex-col bg-gray-50 dark:bg-gray-900">
        <I18nProvider>
          <ToastProvider>
            <SupabaseProvider>
              <ThemeProvider>
                <PWAActivator />
                {children}
              </ThemeProvider>
            </SupabaseProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
