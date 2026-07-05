'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { customers, labels as labelsApi, type Customer, type Label } from '@/lib/api'
import {
  ArrowLeft, Loader2, AlertTriangle, Disc3,
  Star, CheckCircle2, XCircle, ShieldOff,
  Search, Plus, Tag,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)

  function reload() {
    customers.get(Number(id))
      .then((res) => setCustomer(res.data))
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    customers.get(Number(id))
      .then((res) => setCustomer(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function doAction(action: () => Promise<unknown>, msg: string) {
    if (!confirm(msg)) return
    setActing(true)
    try {
      await action()
      reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-sn-cyan" />
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-2 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-xl p-4">
      <AlertTriangle size={16} /> {error}
    </div>
  )

  const c = customer!

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/customers" className="flex items-center gap-1 text-sm text-sn-muted hover:text-sn-cyan transition-colors mb-4">
          <ArrowLeft size={14} /> Customers
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sn-cyan/30 to-sn-purple/30 border border-sn-border flex items-center justify-center text-xl font-bold text-sn-white">
              {c.name[0]}{c.surname[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white">{c.name} {c.surname}</h1>
                {c.featured && <Star size={15} className="text-sn-gold fill-sn-gold" />}
              </div>
              <p className="text-sm text-sn-muted">{c.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {c.is_blocked ? (
                  <span className="status-badge bg-sn-red/10 text-sn-red border border-sn-red/20">Blocked</span>
                ) : c.is_active ? (
                  <span className="status-badge bg-sn-green/10 text-sn-green border border-sn-green/20">Active</span>
                ) : (
                  <span className="status-badge bg-sn-muted/10 text-sn-muted border border-sn-border">Inactive</span>
                )}
                <span className="status-badge bg-sn-purple/10 text-sn-violet border border-sn-violet/20 capitalize">{c.role}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {acting && <Loader2 size={16} className="animate-spin text-sn-cyan self-center" />}
            {!acting && (
              <>
                {!c.is_active && !c.is_blocked && (
                  <button onClick={() => doAction(() => customers.activate(c.id), 'Activate this customer?')} className="sn-btn-ghost text-sn-green border-sn-green/30 text-xs">
                    <CheckCircle2 size={13} /> Activate
                  </button>
                )}
                {c.is_active && (
                  <button onClick={() => doAction(() => customers.deactivate(c.id), 'Deactivate this customer?')} className="sn-btn-ghost text-xs">
                    <XCircle size={13} /> Deactivate
                  </button>
                )}
                {!c.is_blocked && (
                  <button onClick={() => doAction(() => customers.block(c.id), 'Block this customer? Their login will be disabled.')} className="sn-btn-danger text-xs">
                    <ShieldOff size={13} /> Block
                  </button>
                )}
                <button
                  onClick={() => doAction(() => customers.toggleFeatured(c.id), c.featured ? 'Remove from featured?' : 'Mark as featured on public site?')}
                  className={clsx('sn-btn-ghost text-xs', c.featured ? 'text-sn-gold border-sn-gold/30' : '')}
                >
                  <Star size={13} /> {c.featured ? 'Unfeature' : 'Feature'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="sn-card p-4">
          <p className="sn-label">Customer type</p>
          <p className="text-sm text-sn-white capitalize">{c.customer_type ?? '—'}</p>
          {c.company_name && <p className="text-xs text-sn-muted mt-1">{c.company_name}</p>}
        </div>
        <div className="sn-card p-4">
          <p className="sn-label">Role</p>
          <p className="text-sm text-sn-white capitalize">{c.role}</p>
        </div>
        <div className="sn-card p-4">
          <p className="sn-label">Joined</p>
          <p className="text-sm text-sn-white">{new Date(c.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Labels */}
      <div className="sn-card mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sn-border">
          <h2 className="text-sm font-semibold text-sn-white flex items-center gap-1.5">
            <Tag size={14} className="text-sn-violet" /> Labels
          </h2>
        </div>

        {/* Assigned labels list */}
        <div className="divide-y divide-sn-border">
          {(!c.labels || c.labels.length === 0) && (
            <p className="px-5 py-4 text-sm text-sn-muted">No labels assigned yet</p>
          )}
          {c.labels?.map((l) => (
            <div key={l.id} className="px-5 py-3 flex items-center justify-between">
              <Link href={`/labels/${l.id}`} className="text-sm text-sn-white hover:text-sn-cyan transition-colors">
                {l.name}
              </Link>
              <Link href={`/releases?label_id=${l.id}`} className="text-xs text-sn-muted hover:text-sn-cyan transition-colors flex items-center gap-1">
                <Disc3 size={12} /> View releases
              </Link>
            </div>
          ))}
        </div>

        {/* Searchable label assigner */}
        <div className="px-5 py-4 border-t border-sn-border">
          <LabelAssigner
            customerId={c.id}
            assignedIds={(c.labels ?? []).map(l => l.id)}
            onAssigned={reload}
          />
        </div>
      </div>

      {/* Releases quick view */}
      <div className="sn-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sn-border">
          <h2 className="text-sm font-semibold text-sn-white flex items-center gap-1.5">
            <Disc3 size={14} className="text-sn-cyan" /> Releases
          </h2>
          <Link href={`/releases?customer_id=${c.id}`} className="text-xs text-sn-cyan hover:underline">
            View all →
          </Link>
        </div>
        {(!c.releases || c.releases.length === 0) ? (
          <p className="px-5 py-6 text-sm text-sn-muted">No releases yet</p>
        ) : (
          <div className="divide-y divide-sn-border">
            {c.releases.slice(0, 5).map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <Link href={`/releases/${r.id}`} className="text-sm text-sn-white hover:text-sn-cyan transition-colors">
                    {r.title}
                  </Link>
                  <p className="text-xs text-sn-muted">{r.label?.name}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full border capitalize
                  bg-sn-muted/10 text-sn-muted border-sn-border">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Label Assigner ─────────────────────────────────────────────────────────────
function LabelAssigner({
  customerId,
  assignedIds,
  onAssigned,
}: {
  customerId: number
  assignedIds: number[]
  onAssigned: () => void
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Label[]>([])
  const [assigning, setAssigning] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      labelsApi.list(`search=${encodeURIComponent(search)}&per_page=8`)
        .then(res => setResults((res.data ?? []).filter((l: Label) => !assignedIds.includes(l.id))))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search, assignedIds])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function assign(labelId: number) {
    setAssigning(labelId)
    try {
      await labelsApi.assign(labelId, customerId)
      onAssigned()
      setSearch('')
      setResults([])
      setOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to assign label')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sn-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search and assign a label…"
            className="sn-input pl-8 text-sm w-full"
          />
        </div>
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-sn-panel border border-sn-border rounded-lg shadow-xl overflow-hidden">
          {results.map(l => (
            <button
              key={l.id}
              onClick={() => assign(l.id)}
              disabled={assigning === l.id}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-sn-white hover:bg-sn-surface transition-colors"
            >
              <span className="flex items-center gap-2">
                <Tag size={12} className="text-sn-violet flex-shrink-0" />
                {l.name}
              </span>
              {assigning === l.id
                ? <Loader2 size={12} className="animate-spin text-sn-cyan" />
                : <Plus size={12} className="text-sn-muted" />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
