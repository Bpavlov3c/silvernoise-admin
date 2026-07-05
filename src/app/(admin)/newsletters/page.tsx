'use client'

import { Newspaper } from 'lucide-react'

export default function NewslettersPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2 mb-6">
        <Newspaper size={22} className="text-sn-violet" /> Newsletters
      </h1>
      <div className="sn-card p-8 text-center text-sn-muted text-sm">
        Newsletter management — coming soon
      </div>
    </div>
  )
}
