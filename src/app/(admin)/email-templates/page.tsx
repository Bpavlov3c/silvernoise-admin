'use client'

import { Mail } from 'lucide-react'

export default function EmailTemplatesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2 mb-6">
        <Mail size={22} className="text-sn-cyan" /> Email Templates
      </h1>
      <div className="sn-card p-8 text-center text-sn-muted text-sm">
        Email template editor — coming soon
      </div>
    </div>
  )
}
