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
  description: 'Créez votre invitation de mariage avec Eventia, partagez les liens personnels et gérez les réponses, les tables et les cartes d’entrée de vos invités.',
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
        {process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: 'var l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Dancing+Script:wght@500;600&family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap";document.head.appendChild(l);',
          }}
        />
        <noscript>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Dancing+Script:wght@500;600&family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet" />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: 'if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(){})}window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();window.__eventiaInstallPrompt=event;});',
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
