'use client';

import { Refine, type I18nProvider } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from '@refinedev/supabase';
import { ThemedLayout, ThemedTitle, useNotificationProvider } from '@refinedev/antd';
import { App as AntdApp, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { CalendarOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons';
import type { AuthProvider } from '@refinedev/core';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseReady } from '@/config/supabase';

const i18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => {
    if (key === 'buttons.logout') return 'Déconnexion';
    if (typeof defaultMessage === 'string') return defaultMessage;
    if (typeof options === 'string') return options;
    return key;
  },
  changeLocale: async () => {},
  getLocale: () => 'fr',
};

const theme = {
  token: {
    colorPrimary: '#7c3aed',
    colorInfo: '#2563eb',
    colorLink: '#7c3aed',
    borderRadius: 12,
    fontFamily: "Inter, 'Segoe UI', sans-serif",
  },
};

const authProvider: AuthProvider = {
  login: async () => ({ success: true, redirectTo: '/auth/login?redirect=/admin' }),
  logout: async () => {
    if (isSupabaseReady()) await createClient().auth.signOut();
    return { success: true, redirectTo: '/auth/login' };
  },
  check: async () => {
    if (!isSupabaseReady()) return { authenticated: false, redirectTo: '/auth/login?redirect=/admin' };
    const { data } = await createClient().auth.getSession();
    if (!data.session) return { authenticated: false, redirectTo: '/auth/login?redirect=/admin' };
    return { authenticated: true };
  },
  onError: async (error) => ({ error }),
  getIdentity: async () => {
    if (!isSupabaseReady()) return null;
    const { data } = await createClient().auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, name: data.user.email || 'Admin' };
  },
  getPermissions: async () => 'super_admin',
};

function AdminRefine({ children }: { children: React.ReactNode }) {
  const notificationProvider = useNotificationProvider();
  const supabaseReady = isSupabaseReady();

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={supabaseReady ? dataProvider(createClient()) : undefined}
      authProvider={authProvider}
      notificationProvider={notificationProvider}
      resources={[
        {
          name: 'dashboard',
          list: '/admin',
          meta: { label: 'Vue d’ensemble', icon: <DashboardOutlined /> },
        },
        {
          name: 'users',
          list: '/admin/comptes',
          meta: { label: 'Comptes', icon: <TeamOutlined /> },
        },
        {
          name: 'events',
          list: '/admin/evenements',
          show: '/admin/evenements/show/:id',
          meta: { label: 'Mariages', icon: <CalendarOutlined /> },
        },
      ]}
      options={{ syncWithLocation: false, warnWhenUnsavedChanges: false }}
      i18nProvider={i18nProvider}
    >
      <style>{`
        @media (max-width: 991px) {
          .ant-layout-content > div {
            padding-left: 56px !important;
          }
        }
      `}</style>
      <ThemedLayout Title={(props) => <ThemedTitle {...props} text="Eventia" />}>
        {children}
      </ThemedLayout>
    </Refine>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={frFR} theme={theme}>
      <AntdApp>
        <AdminRefine>{children}</AdminRefine>
      </AntdApp>
    </ConfigProvider>
  );
}
