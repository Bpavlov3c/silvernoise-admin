'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { clsx } from 'clsx'

interface ConfirmModalProps {
  open: boolean
  icon?: React.ReactNode
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  icon,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-sn-dark border border-sn-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-sn-muted hover:text-sn-white hover:bg-sn-surface transition-colors"
        >
          <X size={15} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            variant === 'danger' ? 'bg-sn-red/10 text-sn-red' : 'bg-sn-cyan/10 text-sn-cyan'
          )}>
            {icon ?? <AlertTriangle size={22} />}
          </div>

          {/* Text */}
          <h3 className="text-base font-semibold text-sn-white mb-1.5">{title}</h3>
          <p className="text-sm text-sn-muted leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 sn-btn-ghost py-2 text-sm disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40',
              variant === 'danger'
                ? 'bg-sn-red text-white hover:bg-sn-red/90'
                : 'bg-sn-cyan text-sn-bg hover:bg-sn-cyan/90'
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
