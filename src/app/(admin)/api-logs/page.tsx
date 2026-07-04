'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Play } from 'lucide-react'
import { apiLogs, kvz, type ApiLog } from '@/lib/api'

export default function ApiLogsPage() {
  const [logs, setLogs]       = useState<ApiLog[]>([])
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(''