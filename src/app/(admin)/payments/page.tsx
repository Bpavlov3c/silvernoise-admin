'use client'

import { useEffect, useState, useCallback } from 'react'
import { payments, type PaymentRequest } from '@/lib/api'
import { CreditCard, Loader2, AlertTriangle, Download, Upload, X, CheckCircle2, XCircle } from 'lucide-react'
import { clsx } from 'clsx'

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(n)
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-sn-gold/10 text-sn-gold border border-sn-gold/20',
  processing: 'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20',
  sent:       'bg-sn-green/10 text-sn-green border border-sn-green/20',
  completed:  'bg-sn-green/10 text-sn-green border border-sn-green/20',
  rejected:   'bg-sn-red/10 text-sn-red border border-sn-red/20',
}

const STATUS_OPTIONS = ['pending', 'processing', 'sent', 'completed', 'rejected']

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentRequest[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [processTarget, setProcessTarget] = useState<PaymentRequest | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))

    payments
      .list(params.toString())
      .then((res) => { setData(res.data ?? []); setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 }) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  useEffect(() => { fetchData() }, [fetchData])

  async function downloadAttachment(id: number) {
    setDownloadingId(id)
    try {
      const { download_url } = await payments.attachment(id)
      window.open(download_url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to download attachment')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <CreditCard size={22} className="text-sn-green" />
            Payments
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="sn-input w-40"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
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
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-sn-border">
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Periods</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Requested</th>
                <th className="text-right px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Paid date</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Document</th>
                <th className="text-right px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sn-border">
              {data.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-sn-muted">No payments found</td></tr>
              )}
              {data.map((p) => {
                const terminal = p.status === 'completed' || p.status === 'rejected'
                return (
                  <tr key={p.id} className="hover:bg-sn-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sn-white">{p.customer?.name} {p.customer?.surname}</p>
                      <p className="text-xs text-sn-muted">{p.customer?.email}</p>
                      {p.iban && <p className="text-[11px] text-sn-muted font-mono mt-0.5">{p.iban}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-sn-muted">
                      {p.periods && p.periods.length > 0
                        ? p.periods.map((pd) => pd.period_label).join(', ')
                        : (p.report?.report_period ?? '—')}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-sn-muted">
                      {fmtDate(p.requested_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-sn-gold tabular-nums">{fmt(p.amount, p.currency)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs rounded-full px-2.5 py-0.5 border font-medium capitalize',
                        STATUS_STYLES[p.status] ?? 'bg-sn-muted/10 text-sn-muted border-sn-border')}>
                        {p.status}
                      </span>
                      {p.admin_notes && (
                        <p className="text-[11px] text-sn-muted mt-0.5 max-w-[180px] truncate" title={p.admin_notes}>{p.admin_notes}</p>
                      )}
                    </td>
                    <td className={clsx('px-4 py-3 hidden lg:table-cell text-xs tabular-nums', p.paid_at ? 'text-sn-green' : 'text-sn-muted')}>
                      {fmtDate(p.paid_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => downloadAttachment(p.id)}
                        disabled={!p.has_attachment || downloadingId === p.id}
                        title={p.has_attachment ? 'Download attached document' : 'No document attached'}
                        className="flex items-center gap-1 text-xs text-sn-cyan hover:text-sn-white transition-colors disabled:text-sn-muted disabled:cursor-not-allowed"
                      >
                        {downloadingId === p.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Download size={12} />}
                        {p.has_attachment ? 'Download' : '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setProcessTarget(p)}
                        className={clsx('sn-btn-primary text-xs py-1 px-3', terminal && 'opacity-70')}
                      >
                        {terminal ? 'Re-process' : 'Process payment'}
                      </button>
                    </td>
                  </tr>
                )
              })}
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

      {processTarget && (
        <ProcessPaymentModal
          payment={processTarget}
          onClose={() => setProcessTarget(null)}
          onSuccess={() => { setProcessTarget(null); fetchData() }}
        />
      )}
    </div>
  )
}

// ── Process payment modal ──────────────────────────────────────────
function ProcessPaymentModal({
  payment,
  onClose,
  onSuccess,
}: {
  payment: PaymentRequest
  onClose: () => void
  onSuccess: () => void
}) {
  const [action, setAction] = useState<'paid' | 'reject'>('paid')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const periodLabel = payment.periods && payment.periods.length > 0
    ? payment.periods.map((pd) => pd.period_label).join(', ')
    : (payment.report?.report_period ?? '—')

  async function submit() {
    setErr('')
    setSubmitting(true)
    try {
      await payments.process(payment.id, {
        action,
        admin_notes: note.trim() || undefined,
        attachment: file ?? undefined,
      })
      onSuccess()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to process payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-sn-panel border border-sn-border rounded-2xl shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-sn-border">
          <div>
            <h2 className="text-lg font-bold text-sn-white font-display">Process payment</h2>
            <p className="text-sm text-sn-muted mt-0.5">
              {payment.customer?.name} {payment.customer?.surname} · {fmt(payment.amount, payment.currency)}
            </p>
            <p className="text-xs text-sn-muted mt-0.5">{periodLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sn-muted hover:text-sn-white hover:bg-sn-surface transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Action choice */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('paid')}
              className={clsx('flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                action === 'paid'
                  ? 'border-sn-green/50 bg-sn-green/10 text-sn-green'
                  : 'border-sn-border text-sn-muted hover:text-sn-white')}
            >
              <CheckCircle2 size={15} /> Mark as paid
            </button>
            <button
              type="button"
              onClick={() => setAction('reject')}
              className={clsx('flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                action === 'reject'
                  ? 'border-sn-red/50 bg-sn-red/10 text-sn-red'
                  : 'border-sn-border text-sn-muted hover:text-sn-white')}
            >
              <XCircle size={15} /> Reject
            </button>
          </div>

          <div>
            <label className="sn-label block mb-1">
              {action === 'reject' ? 'Reason / note' : 'Note (optional)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={action === 'reject' ? 'Why is this request rejected? (sent to the customer)' : 'Optional note included in the email'}
              className="sn-input w-full resize-none"
            />
          </div>

          <div>
            <label className="sn-label block mb-1">
              Attach document <span className="text-sn-muted text-[10px] normal-case">(optional · PDF · max 10 MB · emailed + downloadable)</span>
            </label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-sn-border hover:border-sn-cyan/40 bg-sn-surface cursor-pointer transition-colors">
              <Upload size={14} className="text-sn-muted flex-shrink-0" />
              <span className="text-sm text-sn-muted truncate flex-1">{file ? file.name : 'Choose a PDF'}</span>
              {file && (
                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null) }}
                  className="text-sn-muted hover:text-sn-red transition-colors flex-shrink-0">
                  <X size={13} />
                </button>
              )}
              <input type="file" accept=".pdf" className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {err && (
            <p className="text-xs text-sn-red flex items-center gap-1">
              <AlertTriangle size={11} /> {err}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="sn-btn-ghost flex-1" disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className={clsx('flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                action === 'reject' ? 'bg-sn-red hover:bg-sn-red/90' : 'bg-sn-green hover:bg-sn-green/90',
                submitting && 'opacity-60')}
            >
              {submitting
                ? <Loader2 size={14} className="animate-spin" />
                : (action === 'reject' ? <XCircle size={14} /> : <CheckCircle2 size={14} />)}
              {submitting ? 'Processing…' : (action === 'reject' ? 'Reject payment' : 'Mark as paid')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
