'use client'

import { RefreshCw } from 'lucide-react'

export default function ApiLogsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold font-display text-sn-white flex items-center gap-2 mb-6">
        <RefreshCw size={22} className="text-sn-cyan" /> API Logs / KVZ Sync
      </h1>
      <div className="sn-card p-8 text-center text-sn-muted text-sm">
        KVZ sync log and API call history — coming soon
      </div>
    </div>
  )
}
