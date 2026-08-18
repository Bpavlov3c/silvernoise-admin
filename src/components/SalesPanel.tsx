'use client'

import { useMemo } from 'react'
import { BarChart3, Music, Radio } from 'lucide-react'
import type { SalesSummary } from '@/lib/api'

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
      <h2 className="text-sm font-semibold text-sn-white flex items-center gap-2">
        <BarChart3 size={16} className="text-sn-cyan" /> {title}
      </h2>

      {/* Totals per currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {summary.totals.map((t) => (
          <div key={t.currency} className="sn-card p-4">
            <p className="text-xs text-sn-muted uppercase tracking-wider mb-1">
              Earnings · {t.currency}
            </p>
            <p className="text-2xl font-bold font-display text-sn-white tabular-nums">
              {money(t.net, t.currency)}
            </p>
            {t.rows != null && (
              <p className="text-[11px] text-sn-muted mt-1">{t.rows} rows</p>
            )}
          </div>
        ))}
      </div>

      {/* Per-currency period chart */}
      {currencies.map((cur) => (
        <PeriodChart key={cur} summary={summary} currency={cur} />
      ))}

      {/* Source breakdown */}
      <div className="sn-card p-4">
        <p className="text-xs text-sn-muted uppercase tracking-wider mb-3">By source</p>
        <div className="space-y-2">
          {summary.by_source.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-sn-white">
                {s.source === 'youtube'
                  ? <Music size={14} className="text-sn-red" />
                  : <Radio size={14} className="text-sn-violet" />}
                {sourceLabel(s.source)}
                <span className="text-sn-muted text-xs">· {s.currency}</span>
              </span>
              <span className="tabular-nums font-medium text-sn-white">
                {money(s.net, s.currency)}
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
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="text-sn-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Label</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_label.map((l, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-sn-white">
                      {l.label_name ?? <span className="text-sn-gold">Unmatched</span>}
                    </td>
                    <td className="px-4 py-2 text-sn-muted text-xs">{l.currency}</td>
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

function PeriodChart({ summary, currency }: { summary: SalesSummary; currency: string }) {
  const rows = summary.by_period.filter((p) => p.currency === currency)
  if (rows.length === 0) return null

  const byPeriod = new Map<string, { start: string; total: number; parts: string[] }>()
  for (const r of rows) {
    const cur = byPeriod.get(r.period) ?? { start: r.period_start, total: 0, parts: [] }
    cur.total += r.net
    cur.parts.push(`${r.source === 'youtube' ? 'YT' : 'DD'} ${money(r.net, currency)}`)
    byPeriod.set(r.period, cur)
  }
  const series = Array.from(byPeriod.entries())
    .map(([period, d]) => ({ period, ...d }))
    .sort((a, b) => a.start.localeCompare(b.start))

  const max = Math.max(...series.map((s) => s.total), 1)

  return (
    <div className="sn-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-sn-muted uppercase tracking-wider">Earnings by period · {currency}</p>
        <p className="text-xs text-sn-muted">{series.length} periods</p>
      </div>
      {/* bar track — each column is full-height so the % bar heights resolve */}
      <div className="flex items-end gap-1.5 h-28">
        {series.map((s) => (
          <div key={s.period} className="flex-1 min-w-0 h-full flex flex-col justify-end group">
            <div
              className="w-full bg-sn-cyan/30 hover:bg-sn-cyan/60 rounded-sm transition-all cursor-default"
              style={{ height: `${Math.max((s.total / max) * 100, 2)}%` }}
              title={`${s.period}: ${money(s.total, currency)}\n${s.parts.join('\n')}`}
            />
          </div>
        ))}
      </div>
      {/* period labels row */}
      <div className="flex gap-1.5 mt-1.5">
        {series.map((s) => (
          <span key={s.period} className="flex-1 min-w-0 text-[9px] text-sn-muted text-center truncate">
            {s.period.replace('_', '·')}
          </span>
        ))}
      </div>
    </div>
  )
}
