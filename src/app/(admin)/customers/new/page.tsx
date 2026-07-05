'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { customers } from '@/lib/api'
import { ArrowLeft, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [form, setForm] = useState({
    name:          '',
    surname:       '',
    email:         '',
    customer_type: 'individual' as 'individual' | 'company',
    company_name:  '',
    password:      '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name:          form.name,
        surname:       form.surname,
        email:         form.email,
        customer_type: form.customer_type,
      }
      if (form.customer_type === 'company') payload.company_name = form.company_name
      if (form.password) payload.password = form.password

      const res = await customers.create(payload)
      router.push(`/customers/${res.data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/customers" className="flex items-center gap-1 text-sm text-sn-muted hover:text-sn-cyan transition-colors mb-4">
          <ArrowLeft size={14} /> Customers
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
          <UserPlus size={22} className="text-sn-cyan" /> Add Customer
        </h1>
        <p className="text-sm text-sn-muted mt-1">
          New accounts are inactive by default — activate after creation.
        </p>
      </div>

      {error && (
        <div className="sn-card p-3 mb-5 text-sm text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="sn-card p-6 space-y-5">

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-sn-muted mb-1.5 uppercase tracking-wider">First name *</label>
            <input
              className="sn-input w-full"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="e.g. Ivan"
            />
          </div>
          <div>
            <label className="block text-xs text-sn-muted mb-1.5 uppercase tracking-wider">Last name *</label>
            <input
              className="sn-input w-full"
              value={form.surname}
              onChange={e => set('surname', e.target.value)}
              required
              placeholder="e.g. Petrov"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs text-sn-muted mb-1.5 uppercase tracking-wider">Email *</label>
          <input
            type="email"
            className="sn-input w-full"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            required
            placeholder="artist@example.com"
          />
        </div>

        {/* Customer type */}
        <div>
          <label className="block text-xs text-sn-muted mb-1.5 uppercase tracking-wider">Account type *</label>
          <div className="flex gap-3">
            {(['individual', 'company'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('customer_type', t)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                  form.customer_type === t
                    ? 'border-sn-cyan bg-sn-cyan/10 text-sn-cyan'
                    : 'border-white/10 text-sn-muted hover:border-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Company name (conditional) */}
        {form.customer_type === 'company' && (
          <div>
            <label className="block text-xs text-sn-muted mb-1.5 uppercase tracking-wider">Company name *</label>
            <input
              className="sn-input w-full"
              value={form.company_name}
              onChange={e => set('company_name', e.target.value)}
              required={form.customer_type === 'company'}
              placeholder="e.g. Balkanton Ltd."
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-xs text-sn-muted mb-1.5 uppercase tracking-wider">
            Initial password <span className="normal-case text-sn-muted/60">(optional — set so customer can log in immediately)</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="sn-input w-full pr-10"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Min 8 characters"
              minLength={form.password ? 8 : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sn-muted hover:text-sn-white"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {!form.password && (
            <p className="text-xs text-sn-muted/60 mt-1">
              Leave blank to generate a random password. Customer will need a password reset to log in.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <Link href="/customers" className="sn-btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="sn-btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Create customer
          </button>
        </div>
      </form>
    </div>
  )
}
