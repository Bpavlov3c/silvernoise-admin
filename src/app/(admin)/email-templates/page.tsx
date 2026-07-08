'use client'

import { useEffect, useState } from 'react'
import { emailTemplates, type EmailTemplate } from '@/lib/api'
import {
  Mail, Save, Send, Loader2, AlertTriangle, CheckCircle2, ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'

type Lang = 'bg' | 'en'

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [lang, setLang] = useState<Lang>('bg')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testLang, setTestLang] = useState<Lang>('bg')
  const [testSending, setTestSending] = useState(false)
  const [testMsg, setTestMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    emailTemplates.list()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openTemplate(t: EmailTemplate) {
    setSelected(null)
    setMsg(null)
    setTestMsg(null)
    setLoadingDetail(true)
    emailTemplates.get(t.key)
      .then(full => {
        setSelected(full)
        setSubject((lang === 'bg' ? full.subject_bg : full.subject_en) ?? '')
        setBody((lang === 'bg' ? full.body_bg : full.body_en) ?? '')
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }

  function handleLangSwitch(l: Lang) {
    if (!selected) return
    setLang(l)
    setSubject((l === 'bg' ? selected.subject_bg : selected.subject_en) ?? '')
    setBody((l === 'bg' ? selected.body_bg : selected.body_en) ?? '')
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setMsg(null)
    const patch = lang === 'bg'
      ? { subject_bg: subject, body_bg: body }
      : { subject_en: subject, body_en: body }
    try {
      const updated = await emailTemplates.update(selected.key, patch)
      setSelected(updated)
      setTemplates(ts => ts.map(t => t.key === updated.key ? { ...t, updated_at: updated.updated_at } : t))
      setMsg({ type: 'ok', text: 'Template saved.' })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    if (!selected || !testEmail) return
    setTestSending(true)
    setTestMsg(null)
    try {
      const res = await emailTemplates.sendTest(selected.key, testEmail, testLang)
      setTestMsg({ type: 'ok', text: res.message })
    } catch (e) {
      setTestMsg({ type: 'err', text: e instanceof Error ? e.message : 'Failed to send' })
    } finally {
      setTestSending(false)
    }
  }

  function insertVariable(v: string) {
    setBody(prev => prev + '{{' + v + '}}')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Mail size={22} className="text-sn-cyan" /> Email Templates
          </h1>
          <p className="text-sm text-sn-muted mt-1">Edit system email templates in BG and EN</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sn-card overflow-hidden">
          <div className="px-4 py-3 border-b border-sn-border">
            <p className="text-xs font-semibold text-sn-muted uppercase tracking-wider">Templates</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={18} className="animate-spin text-sn-cyan" />
            </div>
          ) : (
            <div className="divide-y divide-sn-border">
              {templates.length === 0 && (
                <p className="px-4 py-6 text-sm text-sn-muted">No templates found</p>
              )}
              {templates.map(t => (
                <button
                  key={t.key}
                  onClick={() => openTemplate(t)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-l-2',
                    selected?.key === t.key
                      ? 'bg-sn-cyan/10 border-sn-cyan'
                      : 'hover:bg-sn-surface/50 border-transparent'
                  )}
                >
                  <div className="min-w-0">
                    <p className={clsx('text-sm font-medium truncate', selected?.key === t.key ? 'text-sn-cyan' : 'text-sn-white')}>
                      {t.name}
                    </p>
                    <p className="text-xs text-sn-muted font-mono truncate">{t.key}</p>
                  </div>
                  <ChevronRight size={14} className="text-sn-muted flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {!selected && !loadingDetail && !loading && (
            <div className="sn-card p-10 flex flex-col items-center justify-center text-center text-sn-muted">
              <Mail size={32} className="mb-3 opacity-20" />
              <p className="text-sm">Select a template to edit</p>
            </div>
          )}

          {loadingDetail && (
            <div className="sn-card flex items-center justify-center h-48">
              <Loader2 size={20} className="animate-spin text-sn-cyan" />
            </div>
          )}

          {selected && !loadingDetail && (
            <>
              <div className="sn-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-sn-border">
                  <div>
                    <p className="text-sm font-semibold text-sn-white">{selected.name}</p>
                    <p className="text-xs text-sn-muted font-mono">{selected.key}</p>
                  </div>
                  <div className="flex bg-sn-surface rounded-lg p-1 gap-1">
                    {(['bg', 'en'] as Lang[]).map(l => (
                      <button
                        key={l}
                        onClick={() => handleLangSwitch(l)}
                        className={clsx(
                          'px-3 py-1 text-xs font-bold rounded-md transition-colors uppercase tracking-wide',
                          lang === l ? 'bg-sn-cyan text-sn-bg' : 'text-sn-muted hover:text-sn-white'
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="sn-label mb-1.5 block">Subject ({lang.toUpperCase()})</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="sn-input w-full"
                      placeholder={`Subject in ${lang === 'bg' ? 'Bulgarian' : 'English'}...`}
                    />
                  </div>

                  <div>
                    <label className="sn-label mb-1.5 block">Body ({lang.toUpperCase()})</label>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      rows={14}
                      className="sn-input w-full font-mono text-xs leading-relaxed resize-y"
                      placeholder="Email body..."
                    />
                  </div>

                  {selected.variables && selected.variables.length > 0 && (
                    <div>
                      <p className="sn-label mb-2">
                        Available variables{' '}
                        <span className="normal-case font-normal text-sn-muted">-- click to insert</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selected.variables.map(v => (
                          <button
                            key={v}
                            onClick={() => insertVariable(v)}
                            className="text-xs font-mono px-2.5 py-1 rounded-md bg-sn-violet/10 border border-sn-violet/20 text-sn-violet hover:bg-sn-violet/20 transition-colors"
                          >
                            {'{{' + v + '}}'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg && (
                    <div className={clsx(
                      'flex items-center gap-2 text-sm rounded-lg p-3 border',
                      msg.type === 'ok' ? 'text-sn-green bg-sn-green/10 border-sn-green/20' : 'text-sn-red bg-sn-red/10 border-sn-red/20'
                    )}>
                      {msg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {msg.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="sn-btn-primary flex items-center gap-1.5">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? 'Saving...' : 'Save template'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="sn-card p-5">
                <p className="text-sm font-semibold text-sn-white mb-3 flex items-center gap-1.5">
                  <Send size={14} className="text-sn-cyan" /> Send test email
                </p>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="sn-input flex-1 min-w-48"
                  />
                  <select
                    value={testLang}
                    onChange={e => setTestLang(e.target.value as Lang)}
                    className="sn-input w-24"
                  >
                    <option value="bg">BG</option>
                    <option value="en">EN</option>
                  </select>
                  <button
                    onClick={handleSendTest}
                    disabled={testSending || !testEmail}
                    className="sn-btn-ghost flex items-center gap-1.5 text-sn-cyan border-sn-cyan/30 disabled:opacity-40"
                  >
                    {testSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {testSending ? 'Sending...' : 'Send test'}
                  </button>
                </div>
                {testMsg && (
                  <div className={clsx(
                    'flex items-center gap-2 text-sm rounded-lg p-3 border mt-3',
                    testMsg.type === 'ok' ? 'text-sn-green bg-sn-green/10 border-sn-green/20' : 'text-sn-red bg-sn-red/10 border-sn-red/20'
                  )}>
                    {testMsg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {testMsg.text}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
