'use client'

import { Activity } from 'lucide-react'

export default function EmailLogPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2 mb-6">
        <Activity size={22} className="text-sn-orange" /> Email Log
      </h1>
      <div className="sn-card p-8 text-center text-sn-muted text-sm">
        Email log — coming soon
      </div>
    </div>
  )
}
