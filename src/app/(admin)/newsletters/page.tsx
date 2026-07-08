'use client'

import { useEffect, useState, useCallback } from 'react'
import { newsletters, type NewsletterCampaign } from '@/lib/api'
import {
  Newspaper, Plus, Send, Clock, Loader2, AlertTriangle,
  CheckCircle2, Users, ChevronLeft,
} from 'lucide-react'
import { clsx } from 'clsx'

type Lang = 'bg' | 'en'

const SEGMENT_LABELS: Record<string, string> = {
  all:      'All customers',
  active:   'Active customers only',
  inactive: 'Inactive customers',
  artists:  'Artists',
  labels:   'Labels',
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-sn-muted/10 text-sn-muted border-sn-border',
  scheduled: 'bg-sn-gold/10 text-sn-gold border-sn-gold/20',
  sending:   'bg-sn-cyan/10 text-sn-cyan border-sn-cyan/20',
  sent:      'bg-sn-green/10 text-sn-green border-sn-green/20',
}

function emptyDraft(): Partial<NewsletterCampaign> {
  return { subject_bg: '', subject_en: '', body_bg: '', body_en: '', segment: 'all' }
}

export default function NewslettersPage() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [composing, setComposing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<NewsletterCampaign>>(emptyDraft())
  const [lang, setLang] = useState<Lang>('bg')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [formMsg, setFormMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchCampaigns = useCallback(() => {
    setLoading(true)
    newsletters.list(`page=${page}`)
      .then(res => {
        setCampaigns(res.data ?? [])
        setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  function startNew() {
    setEditId(null)
    setForm(emptyDraft())
    setLang('bg')
    setFormMsg(null)
    setScheduleDate('')
    setComposing(true)
  }

  function openDraft(c: NewsletterCampaign) {
    if (c.status !== 'draft') return
    setEditId(c.id)
    setForm({ subject_bg: c.subject_bg, subject_en: c.subject_en, body_bg: c.body_bg, body_en: c.body_en, segment: c.segment })
    setLang('bg')
    setFormMsg(null)
    setScheduleDate('')
    setComposing(true)
  }

  function setField(key: keyof NewsletterCampaign, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setFormMsg(null)
    try {
      if (editId) {
        await newsletters.update(editId, form)
        setFormMsg({ type: 'ok', text: 'Draft saved.' })
      } else {
        const created = await newsletters.create(form)
        setEditId(created.id)
        setFormMsg({ type: 'ok', text: 'Draft created.' })
      }
      fetchCampaigns()
    } catch (e) {
      setFormMsg({ type: 'err', text: e instanceof Error ? e.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    if (!editId) { setFormMsg({ type: 'err', text: 'Save the draft first.' }); return }
    if (!confirm('Send this newsletter to selected recipients now?')) return
    setSending(true)
    setFormMsg(null)
    try {
      const res = await newsletters.send(editId)
      setFormMsg({ type: 'ok', text: res.message })
      fetchCampaigns()
      setTimeout(() => setComposing(false), 1500)
    } catch (e) {
      setFormMsg({ type: 'err', text: e instanceof Error ? e.message : 'Send failed' })
    } finally {
      setSending(false)
    }
  }

  async function handleSchedule() {
    if (!editId) { setFormMsg({ type: 'err', text: 'Save the draft first.' }); return }
    if (!scheduleDate) { setFormMsg({ type: 'err', text: 'Pick a date and time.' }); return }
    setScheduling(true)
    setFormMsg(null)
    try {
      const res = await newsletters.schedule(editId, scheduleDate)
      setFormMsg({ type: 'ok', text: res.message })
      fetchCampaigns()
      setScheduleDate('')
      setTimeout(() => setComposing(false), 1500)
    } catch (e) {
      setFormMsg({ type: 'err', text: e instanceof Error ? e.message : 'Schedule failed' })
    } finally {
      setScheduling(false)
    }
  }

  if (!composing) return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Newspaper size={22} className="text-sn-violet" /> Newsletters
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} campaigns</p>
        </div>
        <button onClick={startNew} className="sn-btn-primary flex items-center gap-1.5">
          <Plus size={14} /> New campaign
        </button>
      </div>

      <div className="sn-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-sn-cyan" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-sn-muted">
            <Newspaper size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No campaigns yet. Create your first newsletter.</p>
          </div>
        ) : (
          <div className="divide-y divide-sn-border">
            {campaigns.map(c => (
              <div
                key={c.id}
                onClick={() => c.status === 'draft' ? openDraft(c) : undefined}
                className={clsx(
                  'px-5 py-4 flex flex-wrap items-start gap-3 justify-between',
                  c.status === 'draft' ? 'cursor-pointer hover:bg-sn-surface/50 transition-colors' : ''
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sn-white truncate">
                    {c.subject_bg || c.subject_en || '(No subject)'}
                  </p>
                  <p className="text-xs text-sn-muted mt-0.5 flex items-center gap-2">
                    <Users size={11} /> {SEGMENT_LABELS[c.segment] ?? c.segment}
                    {c.recipients_count != null && <span>- {c.recipients_count} recipients</span>}
                    {c.sent_at && <span>- Sent {new Date(c.sent_at).toLocaleDateString()}</span>}
                    {c.scheduled_at && c.status === 'scheduled' && <span>- Scheduled {new Date(c.scheduled_at).toLocaleString()}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={clsx('status-badge border capitalize', STATUS_STYLES[c.status] ?? STATUS_STYLES.draft)}>
                    {c.status}
                  </span>
                  {c.status === 'draft' && <span className="text-xs text-sn-muted">Click to edit</span>}
                </div>
              </div>
            ))}
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <button
            onClick={() => setComposing(false)}
            className="flex items-center gap-1 text-sm text-sn-muted hover:text-sn-cyan transition-colors mb-2"
          >
            <ChevronLeft size={14} /> Back to campaigns
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Newspaper size={22} className="text-sn-violet" />
            {editId ? 'Edit campaign' : 'New campaign'}
          </h1>
        </div>
        <div className="flex bg-sn-surface rounded-lg p-1 gap-1">
          {(['bg', 'en'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={clsx(
                'px-3 py-1 text-xs font-bold rounded-md transition-colors uppercase tracking-wide',
                lang === l ? 'bg-sn-violet text-white' : 'text-sn-muted hover:text-sn-white'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="sn-card p-5 space-y-5">
        <div>
          <label className="sn-label mb-1.5 block">Recipients segment</label>
          <select
            value={form.segment ?? 'all'}
            onChange={e => setField('segment', e.target.value)}
            className="sn-input w-full sm:w-72"
          >
            {Object.entries(SEGMENT_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="sn-label mb-1.5 block">Subject ({lang.toUpperCase()})</label>
          <input
            type="text"
            value={lang === 'bg' ? (form.subject_bg ?? '') : (form.subject_en ?? '')}
            onChange={e => setField(lang === 'bg' ? 'subject_bg' : 'subject_en', e.target.value)}
            className="sn-input w-full"
            placeholder={`Subject in ${lang === 'bg' ? 'Bulgarian' : 'English'}...`}
          />
        </div>

        <div>
          <label className="sn-label mb-1.5 block">Body ({lang.toUpperCase()})</label>
          <textarea
            value={lang === 'bg' ? (form.body_bg ?? '') : (form.body_en ?? '')}
            onChange={e => setField(lang === 'bg' ? 'body_bg' : 'body_en', e.target.value)}
            rows={16}
            className="sn-input w-full font-mono text-xs leading-relaxed resize-y"
            placeholder={`Email body in ${lang === 'bg' ? 'Bulgarian' : 'English'}...`}
          />
          <p className="text-xs text-sn-muted mt-1.5">Personalisation: first_name, email</p>
        </div>

        {formMsg && (
          <div className={clsx(
            'flex items-center gap-2 text-sm rounded-lg p-3 border',
            formMsg.type === 'ok' ? 'text-sn-green bg-sn-green/10 border-sn-green/20' : 'text-sn-red bg-sn-red/10 border-sn-red/20'
          )}>
            {formMsg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {formMsg.text}
          </div>
        )}

        {/* Schedule panel */}
        <div className="bg-sn-surface border border-sn-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-sn-white flex items-center gap-1.5">
            <Clock size={14} className="text-sn-gold" /> Schedule send
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="sn-input flex-1 min-w-[200px]"
            />
            <button
              onClick={handleSchedule}
              disabled={scheduling || !scheduleDate || !editId}
              className="sn-btn-ghost text-sn-gold border-sn-gold/30 flex items-center gap-1.5 disabled:opacity-40"
            >
              {scheduling ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
              {scheduling ? 'Scheduling...' : 'Confirm schedule'}
            </button>
          </div>
          {!editId && (
            <p className="text-xs text-sn-muted">Save the draft first to enable scheduling.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-sn-border justify-between">
          <button onClick={handleSave} disabled={saving} className="sn-btn-ghost flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !editId}
            className="sn-btn-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Sending...' : 'Send now'}
          </button>
        </div>
      </div>
    </div>
  )
}
