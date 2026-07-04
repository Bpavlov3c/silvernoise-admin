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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sn-cyan/30 to-sn-purple/30 border border-sn-border flex items-center justify-center text-xl font-bold text-sn-white">
              {c.name[0]}{c.surname[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display text-sn-white">{c.name} {c.surname}</h1>
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

      <div className="text-right">
        <button
          onClick={() => doAction(() => customers.resetPassword(c.id), 'Send password reset email to this customer?')}
          className="sn-btn-ghost text-xs"
          disabled={acting}
        >
          Reset password
        </button>
      </div>
    </div>
  )
}

// ── Label assigner component ──────────────────────────────────────

function LabelAssigner({
  customerId,
  assignedIds,
  onAssigned,
}: {
  customerId: number
  assignedIds: number[]
  onAssigned: () => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Label[]>([])
  const [searching, setSearching] = useState(false)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [successId, setSuccessId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearching(true)
      const params = new URLSearchParams({ page: '1', per_page: '10' })
      if (search.trim()) params.set('search', search.trim())
      labelsApi.list(params.toString())
        .then(res => setResults(res.data ?? []))
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, open])

  function handleOpen() {
    setOpen(true)
    setSearch('')
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleAssign(label: Label) {
    setAssigning(label.id)
    try {
      await labelsApi.assign(label.id, customerId)
      setSuccessId(label.id)
      setTimeout(() => setSuccessId(null), 2000)
      onAssigned()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to assign label')
    } finally {
      setAssigning(null)
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="sn-btn-ghost text-xs flex items-center gap-1.5 text-sn-cyan border-sn-cyan/30 hover:bg-sn-cyan/10"
      >
        <Plus size={13} /> Assign existing label
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-sn-muted">Search and assign a label</p>

      {/* Search input */}
      <div className="relative">
        {searching
          ? <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-sn-muted" />
          : <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sn-muted" />
        }
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type label name…"
          className="sn-input pl-9 w-full text-sm"
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-lg border border-sn-border bg-sn-card divide-y divide-sn-border max-h-56 overflow-y-auto">
          {results.map(label => {
            const alreadyAssigned = assignedIds.includes(label.id)
            const isAssigning = assigning === label.id
            const isSuccess = successId === label.id

            return (
              <div
                key={label.id}
                className={clsx(
                  'flex items-center justify-between px-3 py-2.5',
                  alreadyAssigned ? 'opacity-50' : 'hover:bg-sn-surface/60 cursor-pointer'
                )}
                onClick={() => !alreadyAssigned && !isAssigning && handleAssign(label)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag size={12} className="text-sn-violet flex-shrink-0" />
                  <span className="text-sm text-sn-white truncate">{label.name}</span>
                  {(label as any).customers?.length > 0 && (
                    <span className="text-xs text-sn-muted hidden sm:inline">
                      · {(label as any).customers.map((cu: any) => cu.company_name || `${cu.name} ${cu.surname}`).join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 ml-2">
                  {alreadyAssigned ? (
                    <span className="text-xs text-sn-green">Assigned</span>
                  ) : isSuccess ? (
                    <span className="text-xs text-sn-green">✓ Done</span>
                  ) : isAssigning ? (
                    <Loader2 size={13} className="animate-spin text-sn-cyan" />
                  ) : (
                    <span className="text-xs text-sn-cyan">+ Assign</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!searching && search.trim() && results.length === 0 && (
        <p className="text-xs text-sn-muted py-2">No labels found for "{search}"</p>
      )}

      <div className="pt-1">
        <button onClick={() => setOpen(false)} className="sn-btn-ghost text-xs py-1 px-3">
          Close
        </button>
      </div>
    </div>
  )
}
