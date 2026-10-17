import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';

// Only admins reach the dashboard; anyone else gets a clear message.
export default function AdminRoute() {
  const { user } = useAuth();
  const { t } = useI18n();

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl border border-border bg-card text-primary shadow-soft">
          <ShieldAlert className="h-8 w-8" />
        </span>
        <p className="mt-5 text-muted-foreground">{t('admin.noAccess')}</p>
      </div>
    );
  }

  return <Outlet />;
}