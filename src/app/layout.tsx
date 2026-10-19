import type { Metadata, Viewport } from 'next';
import '@/lib/polyfills';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import SupabaseProvider from '@/providers/auth-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { ToastProvider } from '@/components/ui/toast';
import { PWAActivator } from '@/providers/pwa-activator';
import FreeWhatsAppButton from '@/components/account/FreeWhatsAppButton';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://eventiafinally.vercel.app'),
  title: {
    default: 'Eventia - Créez vos invitations en ligne',
    template: '%s | Eventia',
  },
  description: 'Plateforme de création d\'invitations numériques pour événements. Mariages, anniversaires, baby showers et plus encore.',
  keywords: ['invitation', 'événement', 'mariage', 'anniversaire', 'RSVP', 'WhatsApp'],
  authors: [{ name: 'Eventia' }],
  applicationName: 'Eventia',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Eventia',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Eventia',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7c3aed',
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
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
          media="print"
          onLoad={(event) => { event.currentTarget.media = 'all'; }}
        />
        <noscript>
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();window.__eventiaInstallPrompt=event;});',
          }}
        />
        <link rel="apple-touch-startup-image" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="h-full antialiased flex flex-col bg-gray-50 dark:bg-gray-900">
        <I18nProvider>
          <ToastProvider>
            <SupabaseProvider>
              <ThemeProvider>
                <PWAActivator />
                <FreeWhatsAppButton />
                {children}
              </ThemeProvider>
            </SupabaseProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
