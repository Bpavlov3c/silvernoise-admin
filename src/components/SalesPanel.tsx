'use client'

import { useMemo } from 'react'
import { Music, Radio } from 'lucide-react'
import type { SalesSummary } from '@/lib/api'

const LOCALE = 'en-US'

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

// "q1_2026" -> "Q1 2026" ; "03_2026" -> "March 2026"
function periodTitle(period: string) {
  const q = /^q([1-4])_(\d{4})$/i.exec(period)
  if (q) return `Q${q[1]} ${q[2]}`
  const m = /^(\d{1,2})_(\d{4})$/.exec(period)
  if (m) return new Date(Number(m[2]), Number(m[1]) - 1, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
  return period.replace('_', ' ')
}
// compact axis label: "Q1 ’26" / "Mar ’26"
function periodAxis(period: string) {
  const q = /^q([1-4])_(\d{4})$/i.exec(period)
  if (q) return `Q${q[1]} ’${q[2].slice(2)}`
  const m = /^(\d{1,2})_(\d{4})$/.exec(period)
  if (m) return `${new Date(Number(m[2]), Number(m[1]) - 1, 1).toLocaleDateString(LOCALE, { month: 'short' })} ’${m[2].slice(2)}`
  return period.replace('_', '·')
}

export default function SalesPanel({
  summary,
  showLabels = true,
}: {
  summary: SalesSummary | null
  showLabels?: boolean
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

  // Pivot the per-label rows into one row per label with both currencies:
  // EUR = Digital Distribution, USD = YouTube. Ordered by combined net.
  const byLabelRanked = (() => {
    const map = new Map<number | string, { name: string | null; eur: number; usd: number }>()
    for (const l of summary.by_label) {
      const key = l.label_id ?? 'unmatched'
      const row = map.get(key) ?? { name: l.label_name, eur: 0, usd: 0 }
      if (l.currency === 'EUR') row.eur += l.net
      else if (l.currency === 'USD') row.usd += l.net
      if (l.label_name) row.name = l.label_name
      map.set(key, row)
    }
    return Array.from(map.values()).sort((a, b) => (b.eur + b.usd) - (a.eur + a.usd))
  })()

  return (
    <div className="space-y-5">
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

      {/* Per-label ranked breakdown — DD (EUR) + YouTube (USD) side by side */}
      {showLabels && byLabelRanked.length > 0 && (
        <div className="sn-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-xs text-sn-muted uppercase tracking-wider">By label · ranked</p>
            <p className="text-xs text-sn-muted">{byLabelRanked.length} labels</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[460px]">
              <thead>
                <tr className="text-sn-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 text-right w-12">#</th>
                  <th className="px-4 py-2 text-left">Label</th>
                  <th className="px-4 py-2 text-right">DD · EUR</th>
                  <th className="px-4 py-2 text-right">YouTube · USD</th>
                </tr>
              </thead>
              <tbody>
                {byLabelRanked.map((l, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-right tabular-nums text-sn-muted">{i + 1}</td>
                    <td className="px-4 py-2 text-sn-white">
                      {l.name ?? <span className="text-sn-gold">Unmatched</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {l.eur ? <span className="text-sn-white">{money(l.eur, 'EUR')}</span> : <span className="text-sn-muted">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {l.usd ? <span className="text-sn-white">{money(l.usd, 'USD')}</span> : <span className="text-sn-muted">—</span>}
                    </td>
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

type Bar = { period: string; start: string; total: number; sources: { source: string; net: number }[] }

function PeriodChart({ summary, currency }: { summary: SalesSummary; currency: string }) {
  const rows = summary.by_period.filter((p) => p.currency === currency)
  if (rows.length === 0) return null

  const byPeriod = new Map<string, Bar>()
  for (const r of rows) {
    const cur = byPeriod.get(r.period) ?? { period: r.period, start: r.period_start, total: 0, sources: [] }
    cur.total += r.net
    cur.sources.push({ source: r.source, net: r.net })
    byPeriod.set(r.period, cur)
  }
  const series = Array.from(byPeriod.values()).sort((a, b) => a.start.localeCompare(b.start))
  const max = Math.max(...series.map((s) => s.total), 1)

  return (
    <div className="sn-card p-4 overflow-visible">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-sn-muted uppercase tracking-wider">Earnings by period · {currency}</p>
        <p className="text-xs text-sn-muted">{series.length} periods</p>
      </div>

      {/* bar track — each column is full-height so the % bar heights resolve */}
      <div className="flex items-end gap-1.5 h-28">
        {series.map((s) => (
          <div key={s.period} className="relative flex-1 min-w-0 h-full flex flex-col justify-end group">
            <div
              className="w-full bg-sn-cyan/30 group-hover:bg-sn-cyan rounded-sm transition-colors cursor-pointer"
              style={{ height: `${Math.max((s.total / max) * 100, 2)}%` }}
            />
            <BarTooltip bar={s} currency={currency} />
          </div>
        ))}
      </div>

      {/* period labels row */}
      <div className="flex gap-1.5 mt-1.5">
        {series.map((s) => (
          <span key={s.period} className="flex-1 min-w-0 text-[9px] text-sn-muted text-center truncate">
            {periodAxis(s.period)}
          </span>
        ))}
      </div>
    </div>
  )
}

function BarTooltip({ bar, currency }: { bar: Bar; currency: string }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
      <div className="rounded-lg border border-sn-border bg-sn-dark/95 backdrop-blur px-3 py-2 shadow-xl shadow-black/60 w-max max-w-[240px]">
        <p className="text-[11px] font-semibold text-sn-white whitespace-nowrap">{periodTitle(bar.period)}</p>
        <p className="text-base font-bold text-sn-cyan tabular-nums whitespace-nowrap mt-0.5 mb-2">
          {money(bar.total, currency)}
        </p>
        <div className="space-y-1 border-t border-sn-border pt-2">
          {bar.sources.map((src, i) => (
            <div key={i} className="flex items-center justify-between gap-5 text-[11px] whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-sn-muted">
                <span className={`w-1.5 h-1.5 rounded-full ${src.source === 'youtube' ? 'bg-sn-red' : 'bg-sn-violet'}`} />
                {sourceLabel(src.source)}
              </span>
              <span className="tabular-nums text-sn-white font-medium">{money(src.net, currency)}</span>
            </div>
          ))}
        </div>
      </div>
      {/* arrow */}
      <div className="mx-auto w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-sn-border" />
    </div>
  )
}
