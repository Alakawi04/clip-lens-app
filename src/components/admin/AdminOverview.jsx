import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Activity, CheckCircle2, Gauge, Link2, Upload } from 'lucide-react';
import { backend } from '@/api/supabaseClient';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { useI18n } from '@/lib/i18n';

const STATUSES = ['uploading', 'scenes', 'titles', 'preparing', 'completed', 'failed'];

export default function AdminOverview() {
  const { t } = useI18n();
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [statusAgg, sourceAgg, recent] = await Promise.all([
        backend.data.Analysis.aggregate({ groupBy: 'status', avg: 'score' }),
        backend.data.Analysis.aggregate({ groupBy: 'source_type' }),
        backend.data.Analysis.filter(
          {},
          { sort: '-created_date', limit: 8, fields: ['source_label', 'source_type', 'status', 'score', 'created_date'] }
        ),
      ]);
      if (!active) return;

      const statusRows = statusAgg?.rows || [];
      const sourceRows = sourceAgg?.rows || [];
      const byStatus = {};
      statusRows.forEach((r) => { byStatus[r.status] = r; });

      const total = statusRows.reduce((sum, r) => sum + (r.count || 0), 0);
      const completed = byStatus.completed?.count || 0;
      const rawAvg = byStatus.completed?.avg_score ?? byStatus.completed?.avg ?? null;
      const youtube = sourceRows.find((r) => r.source_type === 'youtube')?.count || 0;
      const upload = sourceRows.find((r) => r.source_type === 'upload')?.count || 0;

      setData({
        total,
        completed,
        youtube,
        upload,
        avg: typeof rawAvg === 'number' ? Math.round(rawAvg) : null,
        statusChart: STATUSES.map((s) => ({ name: t(`status.${s}`), value: byStatus[s]?.count || 0 })).filter((d) => d.value > 0),
        sourceChart: [
          { name: t('recent.type.youtube'), value: youtube },
          { name: t('recent.type.upload'), value: upload },
        ].filter((d) => d.value > 0),
        recent: recent.items || [],
      });
    })();
    return () => { active = false; };
  }, [t]);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl border border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  const pieColors = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Activity} label={t('admin.stat.total')} value={data.total} accent />
        <StatCard icon={CheckCircle2} label={t('admin.stat.completed')} value={data.completed} />
        <StatCard icon={Gauge} label={t('admin.stat.avgScore')} value={data.avg} />
        <StatCard icon={Link2} label={t('admin.stat.youtube')} value={data.youtube} />
        <StatCard icon={Upload} label={t('admin.stat.upload')} value={data.upload} />
      </div>

      {data.total === 0 ? (
        <div className="glass-panel rounded-3xl border border-border px-6 py-16 text-center text-sm text-muted-foreground">
          {t('admin.empty')}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl border border-border p-5">
            <h3 className="font-display text-sm font-bold">{t('admin.chart.status')}</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statusChart} margin={{ top: 4, right: 8, bottom: 4, left: -18 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-border p-5">
            <h3 className="font-display text-sm font-bold">{t('admin.chart.source')}</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.sourceChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} stroke="none">
                    {data.sourceChart.map((entry, i) => (
                      <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
              {data.sourceChart.map((entry, i) => (
                <span key={entry.name} className="inline-flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                  {entry.name} · <span className="font-semibold text-foreground">{entry.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel overflow-hidden rounded-3xl border border-border">
        <h3 className="border-b border-border px-5 py-4 font-display text-sm font-bold">{t('admin.recent')}</h3>
        {data.recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">{t('admin.empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.recent.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.source_label || '—'}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.source_type === 'youtube' ? t('recent.type.youtube') : t('recent.type.upload')}
                  </p>
                </div>
                {a.score != null && <span className="text-sm font-bold text-primary">{a.score}</span>}
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}