'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { labels, customers, type Customer } from '@/lib/api'
import { Tag, Loader2, AlertTriangle } from 'lucide-react'

export default function NewLabelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customer')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [customerId, setCustomerId] = useState<string>(preselectedCustomerId ?? '')
  const [customersList, setCustomersList] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load customers for dropdown
  useEffect(() => {
    customers.list().then(res => setCustomersList(res.data ?? [])).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')
    try {
      // create the label
      const res = await (labels.create as any)({ name: name.trim(), description: description.trim() || undefined })
      const labelData = res.data ?? res   // handle both wrapped and unwrapped response
      const labelId = labelData.id

      // assign customer if selected
      if (customerId && labelId) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'https://silvernoise-api.on-forge.com/api'}/admin/labels/${labelId}/assign-customer`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.getItem('sn_admin_token')}`,
              },
              body: JSON.stringify({ customer_id: Number(customerId) }),
            }
          )
        } catch {
          // non-fatal — label was created, assignment can be done later
        }
      }

      router.push(`/labels/${labelId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create label')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-sn-white flex items-center gap-2">
          <Tag size={22} className="text-sn-purple" />
          New Label
        </h1>
        <p className="text-sm text-sn-muted mt-1">Create a new distribution label</p>
      </div>

      <form onSubmit={handleSubmit} className="sn-card p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Label name */}
        <div>
          <label className="block text-xs font-medium text-sn-muted mb-1.5">
            Label name <span className="text-sn-red">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Hype Production"
            className="sn-input w-full"
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-sn-muted mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description…"
            rows={3}
            className="sn-input w-full resize-none"
          />
        </div>

        {/* Customer */}
        <div>
          <label className="block text-xs font-medium text-sn-muted mb-1.5">Assign to customer</label>
          <select
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className="sn-input w-full"
          >
            <option value="">— None —</option>
            {customersList.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.company_name || `${c.name} ${c.surname}`} ({c.email})
              </option>
            ))}
          </select>
          {preselectedCustomerId && !customersList.find(c => String(c.id) === preselectedCustomerId) && (
            <p className="text-xs text-sn-muted mt-1">Customer #{preselectedCustomerId} pre-selected</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="sn-btn-ghost flex-1"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="sn-btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={saving || !name.trim()}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
            {saving ? 'Creating…' : 'Create label'}
          </button>
        </div>
      </form>
    </div>
  )
}
