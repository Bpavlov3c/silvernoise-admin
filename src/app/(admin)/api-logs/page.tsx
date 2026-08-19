'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Play, BarChart3, X } from 'lucide-react'
import { apiLogs, kvz, type ApiLog } from '@/lib/api'

const PER_PAGE_OPTIONS = [50, 100, 250, 500]

// Predefined quarters 2020–2030 (KVZ sales periods)
const SALES_YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i) // 2020..2030
const SALES_QUARTERS = ['q1', 'q2', 'q3', 'q4']

export default function ApiLogsPage() {
  const [logs, setLogs]       = useState<ApiLog[]>([])
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(50)

  // KVZ Sales sync modal
  const [salesOpen, setSalesOpen]       = useState(false)
  const [salesSyncing, setSalesSyncing] = useState(false)
  const [salesQuarter, setSalesQuarter] = useState('q1')
  const [salesYear, setSalesYear]       = useState(new Date().getFullYear())

  const fetchLogs = useCallback(() => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    apiLogs
      .list(params.toString())
      .then((res) => {
        setLogs(res.data ?? [])
        setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, perPage])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function triggerSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await kvz.sync()
      setSyncMsg(res.message ?? 'Sync job queued — check logs in a moment.')
      setTimeout(fetchLogs, 3000)
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  async function triggerSalesSync() {
    const period = `${salesQuarter}_${salesYear}`
    setSalesSyncing(true)
    setSyncMsg('')
    try {
      const res = await kvz.salesSync(period)
      setSyncMsg(res.message ?? `KVZ sales sync started for ${period}.`)
      setSalesOpen(false)
      setTimeout(fetchLogs, 3000)
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Sales sync failed.')
    } finally {
      setSalesSyncing(false)
    }
  }

  function statusColor(code: number | null) {
    if (!code) return 'text-sn-muted'
    if (code < 300) return 'text-green-400'
    if (code < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
          <RefreshCw size={22} className="text-sn-cyan" /> API Logs / KVZ Sync
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="sn-btn-primary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="sn-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Play size={14} className={syncing ? 'animate-pulse' : ''} />
            {syncing ? 'Queuing…' : 'Run KVZ Labels'}
          </button>
          <button
            onClick={() => setSalesOpen(true)}
            disabled={salesSyncing}
            className="sn-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <BarChart3 size={14} className={salesSyncing ? 'animate-pulse' : ''} />
            {salesSyncing ? 'Starting…' : 'Run KVZ Sales'}
          </button>
        </div>
      </div>

      {/* KVZ Sales period modal */}
      {salesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSalesOpen(false)} />
          <div className="relative w-full max-w-sm bg-sn-dark border border-sn-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            <button
              onClick={() => setSalesOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-sn-muted hover:text-sn-white hover:bg-sn-surface transition-colors"
            >
              <X size={15} />
            </button>
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-sn-cyan/10 text-sn-cyan">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-base font-semibold text-sn-white mb-1.5">Run KVZ Sales sync</h3>
              <p className="text-sm text-sn-muted leading-relaxed mb-4">
                Pick the quarter to import. Digital Distribution is imported for the quarter (EUR);
                YouTube is imported for the three months within it (USD).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sn-muted mb-1 block">Quarter</label>
                  <select
                    value={salesQuarter}
                    onChange={(e) => setSalesQuarter(e.target.value)}
                    className="sn-input w-full text-sm uppercase"
                  >
                    {SALES_QUARTERS.map((q) => (
                      <option key={q} value={q}>{q.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sn-muted mb-1 block">Year</label>
                  <select
                    value={salesYear}
                    onChange={(e) => setSalesYear(Number(e.target.value))}
                    className="sn-input w-full text-sm"
                  >
                    {SALES_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-sn-muted mt-3">
                Period: <code className="text-sn-cyan">{salesQuarter}_{salesYear}</code>
              </p>
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => setSalesOpen(false)}
                disabled={salesSyncing}
                className="flex-1 sn-btn-ghost py-2 text-sm disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={triggerSalesSync}
                disabled={salesSyncing}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-sn-cyan text-sn-bg hover:bg-sn-cyan/90 transition-all disabled:opacity-40"
              >
                {salesSyncing ? 'Starting…' : 'Run sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback banners */}
      {syncMsg && (
        <div className="sn-card p-3 mb-4 text-sm text-sn-cyan border border-sn-cyan/30">
          {syncMsg}
        </div>
      )}
      {error && (
        <div className="sn-card p-3 mb-4 text-sm text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      {/* Info strip */}
      <div className="sn-card p-4 mb-6 flex flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-sn-muted w-16">Labels:</span>
          <code className="text-sn-cyan">GET /rest/releases</code>
          <code className="text-sn-muted font-mono">php artisan kvz:sync</code>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-sn-muted w-16">Sales:</span>
          <code className="text-sn-cyan">GET /rest/sales?period=q1_2025</code>
          <code className="text-sn-muted font-mono">php artisan kvz:sales q1_2025</code>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-sn-muted w-16">Auth:</span>
          <code className="text-sn-muted font-mono">X-KVZ-APIKey: &lt;env: KVZ_API_KEY&gt;</code>
        </div>
      </div>

      {/* Logs table */}
      <div className="sn-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-sn-muted">
            {meta?.total ?? 0} total log entries
          </span>
          <div className="flex items-center gap-2 text-sm text-sn-muted">
            <span>Per page:</span>
            {PER_PAGE_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => { setPerPage(n); setPage(1) }}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  perPage === n
                    ? 'bg-sn-cyan/20 text-sn-cyan border border-sn-cyan/30'
                    : 'hover:bg-sn-surface text-sn-muted border border-transparent'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-white/5 text-sn-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Endpoint</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Ms</th>
              <th className="px-4 py-3 text-left">Triggered by</th>
              <th className="px-4 py-3 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sn-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sn-muted">
                  No API logs yet. Make sure <code className="text-sn-cyan">KVZ_API_KEY</code> is set in Forge,
                  then click <strong className="text-sn-white">Run KVZ Sync</strong>.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-sn-muted text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-sn-cyan/10 text-sn-cyan uppercase">
                    {log.source}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-sn-white max-w-[250px] truncate">
                  {log.endpoint}
                </td>
                <td className={`px-4 py-3 font-mono text-xs font-bold ${statusColor(log.status_code)}`}>
                  {log.status_code ?? '—'}
                </td>
                <td className="px-4 py-3 text-sn-muted text-xs">
                  {log.response_time_ms != null ? `${log.response_time_ms}` : '—'}
                </td>
                <td className="px-4 py-3 text-sn-muted text-xs">
                  {log.triggered_by
                    ? `${log.triggered_by.name} ${log.triggered_by.surname}`
                    : 'System'}
                </td>
                <td className="px-4 py-3 text-red-400 text-xs max-w-[200px] truncate" title={log.error_message ?? ''}>
                  {log.error_message ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-sn-muted">
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
