'use client'

import { Settings } from 'lucide-react'

export default function SmtpPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2 mb-6">
        <Settings size={22} className="text-sn-muted" /> SMTP Settings
      </h1>
      <div className="sn-card p-8 text-center text-sn-muted text-sm">
        SMTP configuration — coming soon
      </div>
    </div>
  )
}
