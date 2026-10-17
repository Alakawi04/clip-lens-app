import React from 'react';

export default function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="hover-3d glass-panel rounded-3xl border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${
              accent ? 'brand-gradient text-white shadow-soft' : 'border border-border bg-secondary text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">{value ?? '—'}</p>
    </div>
  );
}