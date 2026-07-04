'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { labels, coverArtUrl } from '@/lib/api'
import {
  Tag, ArrowLeft, Loader2, AlertTriangle,
  Disc3, Users, ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-sn-green/10 text-sn-green border border-sn-green/20',
  pending:   'bg-sn-gold/10 text-sn-gold border border-sn-gold/20',
  approved:  'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20',
  delivered: 'bg-sn-violet/10 text-sn-violet border border-sn-violet/20',
  draft:     'bg-sn-muted/10 text-sn-muted border border-sn-border',
  takedown:  'bg-sn-red/10 text-sn-red border border-sn-red/20',
}

interface LabelCustomer {
  id: number
  name: string
  surname: string
  company_name: string | null
  email?: string
}

interface LabelRelease {
  id: number
  title: string
  catalog_id: string | null
  upc: string | null
  status: string
  cover_art_url: string | null
  original_release_date: string | null
}

interface LabelDetail {
  id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  releases_count: number
  customers: LabelCustomer[]
  releases: LabelRelease[]
}

export default function LabelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [label, setLabel] = useState<LabelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // LabelController show() returns the label directly (no {data:} wrapper)
    labels.get(Number(id))
      .then(res => {
        // handle both {data: ...} and direct label object
        const d = (res as any).data ?? res
        setLabel(d as LabelDetail)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 size={20} className="animate-spin text-sn-cyan" />
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-2 m-4 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-4 text-sm">
      <AlertTriangle size={14} /> {error}
    </div>
  )

  if (!label) return null

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="sn-btn-ghost p-1.5">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold font-display text-sn-white flex items-center gap-2">
            <Tag size={18} className="text-sn-purple flex-shrink-0" />
            {label.name}
          </h1>
          <p className="text-xs text-sn-muted mt-0.5">{label.releases_count} release{label.releases_count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: label info + customers */}
        <div className="space-y-4">
          {/* Logo / info */}
          <div className="sn-card p-4 space-y-3">
            {label.logo_url ? (
              <img src={label.logo_url} alt={label.name} className="w-full max-w-[160px] rounded-lg object-contain" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-sn-surface border border-sn-border flex items-center justify-center">
                <Tag size={28} className="text-sn-muted" />
              </div>
            )}
            {label.description && (
              <p className="text-sm text-sn-muted">{label.description}</p>
            )}
            <div>
              <p className="text-xs text-sn-muted">Slug</p>
              <p className="text-sm font-mono text-sn-white">{label.slug}</p>
            </div>
          </div>

          {/* Customers */}
          <div className="sn-card p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-sn-muted flex items-center gap-1.5">
              <Users size={12} /> Customers ({label.customers?.length ?? 0})
            </h2>
            {(label.customers?.length ?? 0) === 0 ? (
              <p className="text-sm text-sn-muted">No customers assigned</p>
            ) : (
              <div className="space-y-2">
                {label.customers.map(c => (
                  <Link
                    key={c.id}
                    href={`/customers/${c.id}`}
                    className="flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm text-sn-white group-hover:text-sn-cyan transition-colors">
                        {c.company_name || `${c.name} ${c.surname}`}
                      </p>
                      {c.email && <p className="text-xs text-sn-muted">{c.email}</p>}
                    </div>
                    <ExternalLink size={12} className="text-sn-muted group-hover:text-sn-cyan transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: releases */}
        <div className="lg:col-span-2">
          <div className="sn-card overflow-hidden">
            <div className="px-4 py-3 border-b border-sn-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc3 size={14} className="text-sn-cyan" />
                <h2 className="text-sm font-semibold text-sn-white">
                  Releases <span className="text-sn-muted font-normal">({label.releases_count})</span>
                </h2>
              </div>
              {label.releases_count > 20 && (
                <Link
                  href={`/releases?label_id=${label.id}`}
                  className="text-xs text-sn-cyan hover:underline"
                >
                  View all →
                </Link>
              )}
            </div>

            {(label.releases?.length ?? 0) === 0 ? (
              <p className="text-center py-10 text-sn-muted text-sm">No releases found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sn-border">
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium">Release</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium hidden md:table-cell">Catalog ID</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium hidden lg:table-cell">Date</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sn-border">
                  {label.releases.map(r => (
                    <tr key={r.id} className="hover:bg-sn-surface/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {r.cover_art_url ? (
                            <img src={coverArtUrl(r.id)} alt={r.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-sn-surface border border-sn-border flex items-center justify-center flex-shrink-0">
                              <Disc3 size={12} className="text-sn-muted" />
                            </div>
                          )}
                          <Link href={`/releases/${r.id}`} className="text-sn-white hover:text-sn-cyan transition-colors truncate max-w-[180px]">
                            {r.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs text-sn-muted">{r.catalog_id ?? '—'}</td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-sn-muted">
                        {r.original_release_date ? new Date(r.original_release_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={clsx('text-xs rounded-full px-2 py-0.5 border', STATUS_STYLES[r.status] ?? STATUS_STYLES.draft)}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
