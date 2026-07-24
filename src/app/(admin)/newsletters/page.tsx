'use client'

import { useEffect, useState, useCallback } from 'react'
import { newsletters, type NewsletterCampaign } from '@/lib/api'
import {
  Newspaper, Plus, Send, Clock, Loader2, AlertTriangle,
  CheckCircle2, Users, ChevronLeft, Trash2,
} from 'lucide-react'
import { clsx } from 'clsx'
import DateTimePicker from '@/components/ui/DateTimePicker'
import ConfirmModal from '@/components/ui/ConfirmModal'

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
  const [unscheduling, setUnscheduling] = useState(false)
  const [editStatus, setEditStatus] = useState<string>('draft')
  const [scheduleDate, setScheduleDate] = useState('')
  const [formMsg, setFormMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [sendModal, setSendModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState<NewsletterCampaign | null>(null)
  const [viewCampaign, setViewCampaign] = useState<NewsletterCampaign | null>(null)

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

  function openCampaign(c: NewsletterCampaign) {
    setEditId(c.status === 'sent' || c.status === 'sending' ? null : c.id)
    setEditStatus(c.status)
    setViewCampaign(c)
    setForm({ subject_bg: c.subject_bg, subject_en: c.subject_en, body_bg: c.body_bg, body_en: c.body_en, segment: c.segment })
    setLang('bg')
    setFormMsg(null)
    if (c.status === 'scheduled' && c.scheduled_at) {
      const d = new Date(c.scheduled_at)
      const pad = (n: number) => String(n).padStart(2, '0')
      setScheduleDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    } else {
      setScheduleDate('')
    }
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

  function handleSend() {
    if (!editId) { setFormMsg({ type: 'err', text: 'Save the draft first.' }); return }
    setSendModal(true)
  }

  async function confirmSend() {
    setSendModal(false)
    setSending(true)
    setFormMsg(null)
    try {
      const res = await newsletters.send(editId!)
      setFormMsg({ type: 'ok', text: res.message })
      fetchCampaigns()
      setTimeout(() => setComposing(false), 1500)
    } catch (e) {
      setFormMsg({ type: 'err', text: e instanceof Error ? e.message : 'Send failed' })
    } finally {
      setSending(false)
    }
  }

  function handleDelete(c: NewsletterCampaign) {
    setDeleteModal(c)
  }

  async function confirmDelete() {
    if (!deleteModal) return
    const c = deleteModal
    setDeleteModal(null)
    try {
      await newsletters.destroy(c.id)
      fetchCampaigns()
    } catch (e) {
      setFormMsg({ type: 'err', text: e instanceof Error ? e.message : 'Delete failed' })
    }
  }

  async function handleUnschedule() {
    if (!editId) return
    setUnscheduling(true)
    setFormMsg(null)
    try {
      await newsletters.update(editId, { status: 'draft' } as Partial<NewsletterCampaign>)
      setEditStatus('draft')
      setScheduleDate('')
      setFormMsg({ type: 'ok', text: 'Campaign moved back to draft.' })
      fetchCampaigns()
    } catch (e) {
      setFormMsg({ type: 'err', text: e instanceof Error ? e.message : 'Unschedule failed' })
    } finally {
      setUnscheduling(false)
    }
  }

  async function handleSchedule() {
    if (!editId) { setFormMsg({ type: 'err', text: 'Save the draft first.' }); return }
    if (!scheduleDate) { setFormMsg({ type: 'err', text: 'Pick a date and time.' }); return }
    setScheduling(true)
    setFormMsg(null)
    try {
      // scheduleDate is a naive local string ("2026-07-25T09:00") from the picker.
      // Convert to a real UTC ISO-8601 timestamp so the backend (app.timezone=UTC)
      // fires at the moment the admin actually intended in their own timezone.
      const res = await newsletters.schedule(editId, new Date(scheduleDate).toISOString())
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
                onClick={() => openCampaign(c)}
                className="px-5 py-4 flex flex-wrap items-start gap-3 justify-between cursor-pointer hover:bg-sn-surface/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sn-white truncate">
                    {c.subject_bg || c.subject_en || '(No subject)'}
                  </p>
                  <p className="text-xs text-sn-muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><Users size={11} /> {SEGMENT_LABELS[c.segment] ?? c.segment}</span>
                    {c.recipients_count != null && <span>· {c.recipients_count} recipients</span>}
                    {c.sent_at && <span>· Sent {new Date(c.sent_at).toLocaleDateString()}</span>}
                    {c.scheduled_at && c.status === 'scheduled' && <span>· Scheduled {new Date(c.scheduled_at).toLocaleString()}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={clsx('status-badge border capitalize', STATUS_STYLES[c.status] ?? STATUS_STYLES.draft)}>
                    {c.status}
                  </span>
                  {(c.status === 'draft' || c.status === 'scheduled') ? (
                    <>
                      <span className="text-xs text-sn-muted hidden sm:block">Click to edit</span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(c) }}
                        className="p-1.5 rounded-lg text-sn-muted hover:text-sn-red hover:bg-sn-red/10 transition-all"
                        title="Delete campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-sn-muted hidden sm:block">Click to view</span>
                  )}
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
    <>
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
            {editStatus === 'sent' || editStatus === 'sending'
              ? 'View campaign'
              : editId ? 'Edit campaign' : 'New campaign'}
            {editStatus === 'scheduled' && (
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-sn-gold/10 text-sn-gold border border-sn-gold/20">
                Scheduled
              </span>
            )}
            {(editStatus === 'sent' || editStatus === 'sending') && (
              <span className={clsx(
                'text-xs font-normal px-2 py-0.5 rounded-full border',
                STATUS_STYLES[editStatus]
              )}>
                {editStatus.charAt(0).toUpperCase() + editStatus.slice(1)}
              </span>
            )}
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
        {/* Sent stats banner */}
        {(editStatus === 'sent' || editStatus === 'sending') && viewCampaign && (
          <div className="flex flex-wrap gap-4 p-4 bg-sn-green/5 border border-sn-green/20 rounded-xl text-sm">
            <div>
              <p className="text-xs text-sn-muted mb-0.5">Status</p>
              <span className={clsx('status-badge border capitalize', STATUS_STYLES[editStatus])}>
                {editStatus}
              </span>
            </div>
            {viewCampaign.sent_at && (
              <div>
                <p className="text-xs text-sn-muted mb-0.5">Sent at</p>
                <p className="text-sn-white text-xs">{new Date(viewCampaign.sent_at).toLocaleString()}</p>
              </div>
            )}
            {viewCampaign.recipients_count != null && (
              <div>
                <p className="text-xs text-sn-muted mb-0.5">Recipients</p>
                <p className="text-sn-white text-xs flex items-center gap-1"><Users size={11} /> {viewCampaign.recipients_count}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-sn-muted mb-0.5">Segment</p>
              <p className="text-sn-white text-xs">{SEGMENT_LABELS[viewCampaign.segment] ?? viewCampaign.segment}</p>
            </div>
          </div>
        )}

        <div>
          <label className="sn-label mb-1.5 block">Recipients segment</label>
          <select
            value={form.segment ?? 'all'}
            onChange={e => setField('segment', e.target.value)}
            disabled={editStatus === 'sent' || editStatus === 'sending'}
            className="sn-input w-full sm:w-72 disabled:opacity-60 disabled:cursor-not-allowed"
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
            readOnly={editStatus === 'sent' || editStatus === 'sending'}
            className={clsx('sn-input w-full', (editStatus === 'sent' || editStatus === 'sending') && 'opacity-60 cursor-default')}
            placeholder={`Subject in ${lang === 'bg' ? 'Bulgarian' : 'English'}...`}
          />
        </div>

        <div>
          <label className="sn-label mb-1.5 block">Body ({lang.toUpperCase()})</label>
          <textarea
            value={lang === 'bg' ? (form.body_bg ?? '') : (form.body_en ?? '')}
            onChange={e => setField(lang === 'bg' ? 'body_bg' : 'body_en', e.target.value)}
            readOnly={editStatus === 'sent' || editStatus === 'sending'}
            rows={16}
            className={clsx('sn-input w-full font-mono text-xs leading-relaxed resize-y', (editStatus === 'sent' || editStatus === 'sending') && 'opacity-60 cursor-default')}
            placeholder={`Email body in ${lang === 'bg' ? 'Bulgarian' : 'English'}...`}
          />
          {editStatus !== 'sent' && editStatus !== 'sending' && (
            <p className="text-xs text-sn-muted mt-1.5">Personalisation: first_name, email</p>
          )}
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

        {/* Schedule panel — hidden for sent campaigns */}
        {editStatus !== 'sent' && editStatus !== 'sending' && (
          <div className="bg-sn-surface border border-sn-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-sn-white flex items-center gap-1.5">
              <Clock size={14} className="text-sn-gold" /> Schedule send
            </p>
            <div className="space-y-3">
              <DateTimePicker
                value={scheduleDate}
                onChange={setScheduleDate}
                min={(() => {
                  // Picker works in naive local time, so min must be local too —
                  // toISOString() would return UTC and shift the floor by the offset.
                  const d = new Date(Date.now() + 60000)
                  const p = (n: number) => String(n).padStart(2, '0')
                  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
                })()}
                placeholder="Pick a date & time to send"
                disabled={!editId}
              />
              <p className="text-xs text-sn-muted">
                Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
              </p>
              <button
                onClick={handleSchedule}
                disabled={scheduling || !scheduleDate || !editId}
                className="w-full sn-btn-ghost text-sn-gold border-sn-gold/30 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {scheduling ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                {scheduling ? 'Scheduling...' : 'Confirm schedule'}
              </button>
            </div>
            {!editId && (
              <p className="text-xs text-sn-muted">Save the draft first to enable scheduling.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-sn-border justify-between">
          {editStatus !== 'sent' && editStatus !== 'sending' ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleSave} disabled={saving} className="sn-btn-ghost flex items-center gap-1.5">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                {editStatus === 'scheduled' && (
                  <button
                    onClick={handleUnschedule}
                    disabled={unscheduling}
                    className="sn-btn-ghost text-sn-gold border-sn-gold/30 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {unscheduling ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                    {unscheduling ? 'Unscheduling...' : 'Unschedule'}
                  </button>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !editId}
                className="sn-btn-primary flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending...' : 'Send now'}
              </button>
            </>
          ) : (
            <p className="text-xs text-sn-muted italic">This campaign has already been sent and cannot be modified.</p>
          )}
        </div>
      </div>
    </div>

    {/* Modals — rendered outside the page card but inside the Fragment */}
    <ConfirmModal
      open={sendModal}
      icon={<Send size={22} />}
      title="Send newsletter now?"
      description={`This will immediately send the campaign to all ${
        form.segment === 'all' ? 'customers' : (form.segment ?? 'selected') + ' customers'
      }. This action cannot be undone.`}
      confirmLabel="Yes, send now"
      cancelLabel="Cancel"
      variant="primary"
      loading={sending}
      onConfirm={confirmSend}
      onCancel={() => setSendModal(false)}
    />
    <ConfirmModal
      open={!!deleteModal}
      title="Delete campaign?"
      description={`"${deleteModal?.subject_bg || deleteModal?.subject_en || 'This campaign'}" will be permanently deleted and cannot be recovered.`}
      confirmLabel="Delete"
      cancelLabel="Keep it"
      variant="danger"
      onConfirm={confirmDelete}
      onCancel={() => setDeleteModal(null)}
    />
    </>
  )
}
