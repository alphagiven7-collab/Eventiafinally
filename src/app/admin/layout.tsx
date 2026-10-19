'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminShell from '@/lib/admin/refine-shell';

export default function RefineAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
