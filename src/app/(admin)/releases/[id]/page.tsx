'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { releases, coverArtUrl, type Release } from '@/lib/api'
import {
  Disc3, ArrowLeft, Loader2, AlertTriangle,
  Music, Users, Tag, Store, ExternalLink, Clock,
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

interface Track {
  id: number
  title: string
  isrc: string | null
  track_number: number | null
  disc_number: number | null
  length: number | null
  explicit_lyrics: boolean
  artists?: { id: number; name: string; role: string }[]
  genres?: { id: number; name: string }[]
}

interface ReleaseDetail extends Release {
  copyright_c?: string | null
  copyright_p?: string | null
  // upc already on Release base type
  physical_distribution?: boolean
  kvz_id?: string | null
  genres?: { id: number; name: string }[]
  tracks?: Track[]
  stores?: { id: number; name: string; status: string; store_release_url: string | null; live_at: string | null }[]
}

function fmtSeconds(s: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export default function ReleaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [release, setRelease] = useState<ReleaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    releases.get(Number(id))
      .then(res => setRelease(res.data as ReleaseDetail))
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

  if (!release) return null

  const primaryArtists = release.artists?.filter(a => a.is_primary) ?? []
  const creditArtists  = release.artists?.filter(a => !a.is_primary) ?? []

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="sn-btn-ghost p-1.5">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold font-display text-sn-white truncate flex items-center gap-2">
            <Disc3 size={18} className="text-sn-purple flex-shrink-0" />
            {release.title}
          </h1>
          <p className="text-xs text-sn-muted mt-0.5">
            {release.label?.name} {release.catalog_id ? `· ${release.catalog_id}` : ''}
          </p>
        </div>
        <span className={clsx('text-xs rounded-full px-3 py-1 border font-medium', STATUS_STYLES[release.status] ?? STATUS_STYLES.draft)}>
          {release.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: cover + metadata */}
        <div className="space-y-4">
          {/* Cover art */}
          <div className="sn-card p-4 flex flex-col items-center gap-3">
            {release.cover_art_url ? (
              <img src={coverArtUrl(release.id)} alt={release.title}
                className="w-full max-w-[200px] aspect-square rounded-lg object-cover shadow-lg" />
            ) : (
              <div className="w-full max-w-[200px] aspect-square rounded-lg bg-sn-surface border border-sn-border flex items-center justify-center">
                <Disc3 size={40} className="text-sn-muted" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="sn-card p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-sn-muted">Metadata</h2>
            <Row label="UPC" value={release.upc} mono />
            <Row label="Catalog ID" value={release.catalog_id} mono />
            <Row label="Release date" value={release.original_release_date ?? null} />
            <Row label="Copyright ©" value={release.copyright_c} />
            <Row label="Copyright ℗" value={release.copyright_p} />
            <Row label="Physical" value={release.physical_distribution ? 'Yes' : 'No'} />
            {release.kvz_id && <Row label="KVZ ID" value={release.kvz_id} mono />}
          </div>

          {/* Customer / Label */}
          <div className="sn-card p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-sn-muted">Ownership</h2>
            {release.label && (
              <div>
                <p className="text-xs text-sn-muted">Label</p>
                <Link href={`/labels/${release.label.id}`} className="text-sm text-sn-cyan hover:underline">
                  {release.label.name}
                </Link>
              </div>
            )}
            {release.customer && (
              <div>
                <p className="text-xs text-sn-muted">Customer</p>
                <Link href={`/customers/${release.customer.id}`} className="text-sm text-sn-white hover:text-sn-cyan transition-colors">
                  {(release.customer as any).display_name ?? `${(release.customer as any).name} ${(release.customer as any).surname}`}
                </Link>
              </div>
            )}
          </div>

          {/* Genres */}
          {(release.genres?.length ?? 0) > 0 && (
            <div className="sn-card p-4 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-sn-muted flex items-center gap-1.5">
                <Tag size={12} /> Genres
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {release.genres!.map(g => (
                  <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-sn-violet/10 text-sn-violet border border-sn-violet/20">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Artists */}
          {(release.artists?.length ?? 0) > 0 && (
            <div className="sn-card p-4 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-sn-muted flex items-center gap-1.5">
                <Users size={12} /> Artists
              </h2>
              {primaryArtists.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-sn-muted">Primary</p>
                  {primaryArtists.map(a => (
                    <p key={a.id} className="text-sm text-sn-white">{a.name} <span className="text-sn-muted text-xs">· {a.role}</span></p>
                  ))}
                </div>
              )}
              {creditArtists.length > 0 && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-sn-muted">Credits</p>
                  {creditArtists.map(a => (
                    <p key={a.id} className="text-sm text-sn-white">{a.name} <span className="text-sn-muted text-xs">· {a.role}</span></p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: tracks + stores */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tracks */}
          <div className="sn-card overflow-hidden">
            <div className="px-4 py-3 border-b border-sn-border flex items-center gap-2">
              <Music size={14} className="text-sn-cyan" />
              <h2 className="text-sm font-semibold text-sn-white">
                Tracks <span className="text-sn-muted font-normal">({release.tracks?.length ?? 0})</span>
              </h2>
            </div>
            {(release.tracks?.length ?? 0) === 0 ? (
              <p className="text-center py-8 text-sn-muted text-sm">No tracks found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sn-border">
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium w-8">#</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium">Title</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium hidden md:table-cell">ISRC</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium hidden lg:table-cell">Artists</th>
                    <th className="text-right px-4 py-2 text-xs text-sn-muted font-medium w-16">
                      <Clock size={12} className="inline" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sn-border">
                  {release.tracks!.map(t => (
                    <tr key={t.id} className="hover:bg-sn-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-sn-muted tabular-nums">
                        {t.disc_number && t.disc_number > 1 ? `${t.disc_number}.` : ''}{t.track_number ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sn-white text-sm">{t.title}</p>
                        {t.explicit_lyrics && (
                          <span className="text-xs bg-sn-red/10 text-sn-red border border-sn-red/20 rounded px-1">E</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs text-sn-muted">{t.isrc ?? '—'}</td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-sn-muted">
                        {t.artists?.filter(a => a.role === 'Performer' || a.role === 'Main Artist').map(a => a.name).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-sn-muted tabular-nums">{fmtSeconds(t.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Stores */}
          {(release.stores?.length ?? 0) > 0 && (
            <div className="sn-card overflow-hidden">
              <div className="px-4 py-3 border-b border-sn-border flex items-center gap-2">
                <Store size={14} className="text-sn-cyan" />
                <h2 className="text-sm font-semibold text-sn-white">
                  Stores <span className="text-sn-muted font-normal">({release.stores!.length})</span>
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sn-border">
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium">Store</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium">Status</th>
                    <th className="text-left px-4 py-2 text-xs text-sn-muted font-medium hidden md:table-cell">Live at</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sn-border">
                  {release.stores!.map(s => (
                    <tr key={s.id} className="hover:bg-sn-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-sn-white text-sm">{s.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full border',
                          s.status === 'live' ? 'bg-sn-green/10 text-sn-green border-sn-green/20' :
                          s.status === 'delivered' ? 'bg-sn-cyan/10 text-sn-cyan border-sn-cyan/20' :
                          'bg-sn-muted/10 text-sn-muted border-sn-border'
                        )}>{s.status}</span>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs text-sn-muted">
                        {s.live_at ? new Date(s.live_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {s.store_release_url && (
                          <a href={s.store_release_url} target="_blank" rel="noopener noreferrer"
                            className="text-sn-muted hover:text-sn-cyan transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-sn-muted">{label}</p>
      <p className={clsx('text-sm text-sn-white break-all', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  )
}
