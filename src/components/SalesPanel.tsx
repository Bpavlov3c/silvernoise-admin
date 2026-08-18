'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Youtube, Radio } from 'lucide-react'
import { clsx } from 'clsx'
import type { SalesSummary } from '@/lib/api'

type Metric = 'net' | 'gross'

const SOURCE_LABEL: Record<string, string> = {
  digital_distribution: 'Digital Distribution',
  youtube: 'YouTube',
}
function sourceLabel(s: string) {
  return SOURCE_LABEL[s] ?? s.replace(/_/g, ' ')
}

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(n ?? 0)
  } catch {
    return `${(n ?? 0).toFixed(2)} ${currency}`
  }
}

export default function SalesPanel({
  summary,
  showLabels = true,
  title = 'KVZ Sales',
}: {
  summary: SalesSummary | null
  showLabels?: boolean
  title?: string
}) {
  const [metric, setMetric] = useState<Metric>('net')

  const currencies = useMemo(
    () => (summary?.totals ?? []).map((t) => t.currency),
    [summary],
  )

  if (!summary || summary.totals.length === 0) {
    return (
      <div className="sn-card p-6 text-center text-sn-muted text-sm">
        No sales data yet. Run a <strong className="text-sn-white">KVZ Sales</strong> sync
        (API Logs / KVZ) for a quarter to populate this.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header + metric toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-sn-white flex items-center gap-2">
          <BarChart3 size={16} className="text-sn-cyan" /> {title}
        </h2>
        <div className="flex items-center gap-1 text-xs">
          {(['net', 'gross'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={clsx(
                'px-2.5 py-1 rounded-md capitalize transition-colors border',
                metric === m
                  ? 'bg-sn-cyan/20 text-sn-cyan border-sn-cyan/30'
                  : 'text-sn-muted border-transparent hover:bg-sn-surface',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* KPI totals per currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {summary.totals.map((t) => (
          <div key={t.currency} className="sn-card p-4">
            <p className="text-xs text-sn-muted uppercase tracking-wider mb-1">
              {metric === 'net' ? 'Net' : 'Gross'} · {t.currency}
            </p>
            <p className="text-2xl font-bold font-display text-sn-white tabular-nums">
              {money(metric === 'net' ? t.net : t.gross, t.currency)}
            </p>
            <p className="text-[11px] text-sn-muted mt-1">
              {metric === 'net'
                ? `Gross ${money(t.gross, t.currency)}`
                : `Net ${money(t.net, t.currency)}`}
              {t.rows != null ? ` · ${t.rows} rows` : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Per-currency period chart */}
      {currencies.map((cur) => (
        <PeriodChart key={cur} summary={summary} currency={cur} metric={metric} />
      ))}

      {/* Source breakdown */}
      <div className="sn-card p-4">
        <p className="text-xs text-sn-muted uppercase tracking-wider mb-3">By source</p>
        <div className="space-y-2">
          {summary.by_source.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-sn-white">
                {s.source === 'youtube'
                  ? <Youtube size={14} className="text-sn-red" />
                  : <Radio size={14} className="text-sn-violet" />}
                {sourceLabel(s.source)}
                <span className="text-sn-muted text-xs">· {s.currency}</span>
              </span>
              <span className="tabular-nums font-medium text-sn-white">
                {money(metric === 'net' ? s.net : s.gross, s.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-label table */}
      {showLabels && summary.by_label.length > 0 && (
        <div className="sn-card overflow-hidden">
          <p className="px-4 py-3 text-xs text-sn-muted uppercase tracking-wider border-b border-white/5">
            By label
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-sn-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Label</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_label.map((l, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-sn-white">
                      {l.label_name ?? <span className="text-sn-gold">Unmatched</span>}
                    </td>
                    <td className="px-4 py-2 text-sn-muted text-xs">{l.currency}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sn-muted">{money(l.gross, l.currency)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sn-white font-medium">{money(l.net, l.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function PeriodChart({
  summary,
  currency,
  metric,
}: {
  summary: SalesSummary
  currency: string
  metric: Metric
}) {
  // Sum the chosen metric per period for this currency (across sources).
  const rows = summary.by_period.filter((p) => p.currency === currency)
  if (rows.length === 0) return null

  const byPeriod = new Map<string, { start: string; total: number; parts: string[] }>()
  for (const r of rows) {
    const v = metric === 'net' ? r.net : r.gross
    const cur = byPeriod.get(r.period) ?? { start: r.period_start, total: 0, parts: [] }
    cur.total += v
    cur.parts.push(`${r.source === 'youtube' ? 'YT' : 'DD'} ${money(v, currency)}`)
    byPeriod.set(r.period, cur)
  }
  const series = [...byPeriod.entries()]
    .map(([period, d]) => ({ period, ...d }))
    .sort((a, b) => a.start.localeCompare(b.start))

  const max = Math.max(...series.map((s) => s.total), 1)

  return (
    <div className="sn-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-sn-muted uppercase tracking-wider">
          {metric === 'net' ? 'Net' : 'Gross'} by period · {currency}
        </p>
        <p className="text-xs text-sn-muted">{series.length} periods</p>
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {series.map((s) => (
          <div key={s.period} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
            <div
              className="w-full bg-sn-cyan/25 hover:bg-sn-cyan/50 rounded-sm transition-all cursor-default"
              style={{ height: `${Math.max((s.total / max) * 100, 2)}%` }}
              title={`${s.period}: ${money(s.total, currency)}\n${s.parts.join('\n')}`}
            />
            <span className="text-[9px] text-sn-muted truncate max-w-full rotate-0">
              {s.period.replace('_', '·')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
