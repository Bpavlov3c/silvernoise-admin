'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { reports, sales, type Report, type SalesResponse } from '@/lib/api'
import { FileText, Plus, Loader2, AlertTriangle, BarChart3 } from 'lucide-react'
import { clsx } from 'clsx'
import SalesPanel from '@/components/SalesPanel'

function SalesSection() {
  const [data, setData] = useState<SalesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [year, setYear] = useState('')
  const [quarter, setQuarter] = useState('')
  const [source, setSource] = useState('')
  const [labelId, setLabelId] = useState('')

  const fetchSales = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (year) params.set('year', year)
    if (quarter) params.set('quarter', quarter)
    if (source) params.set('source', source)
    if (labelId) params.set('label_id', labelId)
    sales
      .get(params.toString())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [year, quarter, source, labelId])

  useEffect(() => { fetchSales() }, [fetchSales])

  const meta = data?.meta
  const unmatched = meta?.unmatched_rows ?? 0

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold font-display text-sn-white flex items-center gap-2">
          <BarChart3 size={18} className="text-sn-cyan" /> Sales
        </h2>
        <div className="flex flex-wrap gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="sn-input w-28 text-xs">
            <option value="">All years</option>
            {(meta?.years ?? []).map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="sn-input w-28 text-xs">
            <option value="">All quarters</option>
            {[1, 2, 3, 4].map((q) => <option key={q} value={String(q)}>Q{q}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="sn-input w-44 text-xs">
            <option value="">All sources</option>
            {(meta?.sources ?? []).map((s) => (
              <option key={s} value={s}>{s === 'youtube' ? 'YouTube (USD)' : 'Digital Distribution (EUR)'}</option>
            ))}
          </select>
          <select value={labelId} onChange={(e) => setLabelId(e.target.value)} className="sn-input w-48 text-xs">
            <option value="">All labels</option>
            {(meta?.labels ?? []).map((l) => (
              <option key={l.id} value={String(l.id)}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {unmatched > 0 && (
        <div className="sn-card p-3 mb-4 text-xs text-sn-gold border border-sn-gold/30 flex items-center gap-2">
          <AlertTriangle size={13} />
          {unmatched} sales rows aren’t linked to a label yet ({meta?.unmatched_names ?? 0} distinct names).
          They appear as “Unmatched” below and link automatically once the label exists in KVZ.
        </div>
      )}

      {loading && <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-sn-cyan" /></div>}
      {error && !loading && (
        <div className="flex items-center gap-2 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      {!loading && !error && <SalesPanel summary={data?.summary ?? null} />}
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState<Report[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))

    reports
      .list(params.toString())
      .then((res) => { setData(res.data ?? []); setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 }) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <FileText size={22} className="text-sn-gold" />
            Reports
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
        <Link href="/reports/new" className="sn-btn-primary">
          <Plus size={14} /> Upload report
        </Link>
      </div>

      {/* KVZ sales visualization (separate from the downloadable reports below) */}
      <SalesSection />

      <div className="flex items-center gap-2 mb-4">
        <FileText size={16} className="text-sn-gold" />
        <h2 className="text-lg font-semibold font-display text-sn-white">Downloadable reports</h2>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="sn-input w-36"
        >
          <option value="">All reports</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="sn-card overflow-hidden">
        {loading && <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-sn-cyan" /></div>}
        {error && !loading && (
          <div className="flex items-center gap-2 m-4 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-sn-border">
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Report</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Label</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Period</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sn-border">
              {data.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-sn-muted">No reports found</td></tr>
              )}
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-sn-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sn-white">{r.report_name}</p>
                      <p className="text-xs text-sn-muted">
                        {r.customer?.name} {r.customer?.surname} · {new Date(r.report_date).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-sn-muted">{r.label?.name ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-sn-muted">{r.report_period}</td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'status-badge',
                      r.status === 'paid'
                        ? 'bg-sn-green/10 text-sn-green border border-sn-green/20'
                        : 'bg-sn-gold/10 text-sn-gold border border-sn-gold/20'
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/reports/${r.id}`} className="text-xs text-sn-muted hover:text-sn-cyan transition-colors">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-sn-border flex items-center justify-between text-xs text-sn-muted">
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={meta.current_page === 1} className="sn-btn-ghost text-xs py-1 px-3 disabled:opacity-30">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={meta.current_page === meta.last_page} className="sn-btn-ghost text-xs py-1 px-3 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
