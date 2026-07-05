'use client'

import { useEffect, useRef, useState, useCallback, CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { customers, labels as labelsApi, type Customer, type Label } from '@/lib/api'
import {
  ArrowLeft, Loader2, AlertTriangle,
  Star, CheckCircle2, XCircle, ShieldOff,
  Search, Plus, Tag, X, ChevronDown,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)

  const reload = useCallback(() => {
    customers.get(Number(id))
      .then((res) => setCustomer(res.data))
      .catch((e) => setError(e.message))
  }, [id])

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
      {/* Header */}
      <div className="mb-6">
        <Link href="/customers" className="flex items-center gap-1 text-sm text-sn-muted hover:text-sn-cyan transition-colors mb-4">
          <ArrowLeft size={14} /> Customers
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sn-cyan/30 to-sn-purple/30 border border-sn-border flex items-center justify-center text-xl font-bold text-sn-white flex-shrink-0">
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

      {/* Info cards */}
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

      {/* Labels card */}
      <div className="sn-card">
        <div className="px-5 py-4 border-b border-sn-border">
          <h2 className="text-base font-semibold text-sn-white flex items-center gap-2">
            <Tag size={15} className="text-sn-violet" /> Labels
          </h2>
        </div>

        {(!c.labels || c.labels.length === 0) && (
          <p className="px-5 py-4 text-sm text-sn-muted">No labels assigned yet</p>
        )}
        <div className="divide-y divide-sn-border">
          {c.labels?.map((l) => (
            <LabelRow key={l.id} label={l} customerId={c.id} onRemoved={reload} />
          ))}
        </div>

        <div className="px-5 py-4 border-t border-sn-border">
          <LabelAssigner
            customerId={c.id}
            assignedIds={(c.labels ?? []).map(l => l.id)}
            onAssigned={reload}
          />
        </div>
      </div>
    </div>
  )
}

// ── Label row with remove ───────────────────────────────────────────────────────
function LabelRow({ label, customerId, onRemoved }: {
  label: Label
  customerId: number
  onRemoved: () => void
}) {
  const [removing, setRemoving] = useState(false)

  async function remove() {
    if (!confirm(`Remove "${label.name}" from this customer?`)) return
    setRemoving(true)
    try {
      await labelsApi.unassign(label.id, customerId)
      onRemoved()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove label')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <Link href={`/labels/${label.id}`} className="text-sm text-sn-white hover:text-sn-cyan transition-colors flex items-center gap-2 min-w-0">
        <Tag size={12} className="text-sn-violet flex-shrink-0" />
        <span className="truncate">{label.name}</span>
      </Link>
      <button
        onClick={remove}
        disabled={removing}
        title="Remove label"
        className="p-1.5 rounded text-sn-muted hover:text-sn-red hover:bg-sn-red/10 transition-colors disabled:opacity-40 flex-shrink-0"
      >
        {removing ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
      </button>
    </div>
  )
}

// ── Label assigner — fixed-position dropdown so it never clips ──────────────────
function LabelAssigner({ customerId, assignedIds, onAssigned }: {
  customerId: number
  assignedIds: number[]
  onAssigned: () => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Label[]>([])
  const [assigning, setAssigning] = useState<number | null>(null)
  const [dropStyle, setDropStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      labelsApi.list(`search=${encodeURIComponent(search)}&per_page=10`)
        .then(res => setResults((res.data ?? []).filter((l: Label) => !assignedIds.includes(l.id))))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search, assignedIds])

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    function close() { setOpen(false); setSearch(''); setResults([]) }
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const dropdown = document.getElementById('label-assigner-dropdown')
      if (triggerRef.current?.contains(target)) return
      if (dropdown?.contains(target)) return
      close()
    }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  function openDropdown() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const panelH = 300 // max panel height
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8

    let style: CSSProperties
    if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
      style = { position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
    } else {
      style = { position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
    }
    setDropStyle(style)
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  function toggle() {
    if (open) { setOpen(false); setSearch(''); setResults([]) }
    else openDropdown()
  }

  async function assign(labelId: number) {
    setAssigning(labelId)
    try {
      await labelsApi.assign(labelId, customerId)
      onAssigned()
      setSearch(''); setResults([]); setOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to assign label')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={toggle}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors',
          open
            ? 'border-sn-cyan/50 bg-sn-surface text-sn-white'
            : 'border-sn-border bg-sn-surface text-sn-muted hover:border-sn-cyan/30 hover:text-sn-white'
        )}
      >
        <span className="flex items-center gap-2">
          <Plus size={13} className="text-sn-violet flex-shrink-0" />
          Assign a label
        </span>
        <ChevronDown size={13} className={clsx('transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {/* Dropdown — rendered via fixed positioning, outside card stacking context */}
      {open && (
        <div
          id="label-assigner-dropdown"
          style={dropStyle}
          className="bg-sn-panel border border-sn-border rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-sn-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sn-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search labels..."
                className="sn-input pl-8 text-sm w-full py-2"
                autoComplete="off"
              />
              {search && (
                <button
                  onMouseDown={e => { e.preventDefault(); setSearch(''); setResults([]) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sn-muted hover:text-sn-white transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div style={{ maxHeight: '240px' }} className="overflow-y-auto">
            {results.map(l => (
              <button
                key={l.id}
                onMouseDown={e => { e.preventDefault(); assign(l.id) }}
                disabled={assigning === l.id}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-sn-white hover:bg-sn-surface transition-colors border-b border-sn-border last:border-b-0"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Tag size={12} className="text-sn-violet flex-shrink-0" />
                  <span className="truncate">{l.name}</span>
                </span>
                {assigning === l.id
                  ? <Loader2 size={12} className="animate-spin text-sn-cyan flex-shrink-0" />
                  : <Plus size={12} className="text-sn-muted flex-shrink-0" />
                }
              </button>
            ))}
            {search.trim() && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-sn-muted">No matching labels found</p>
            )}
            {!search.trim() && (
              <p className="px-3 py-3 text-xs text-sn-muted">Type to search for a label to assign</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
