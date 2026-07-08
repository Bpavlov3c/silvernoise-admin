'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react'
import { clsx } from 'clsx'

interface DateTimePickerProps {
  value: string        // ISO datetime-local string: "YYYY-MM-DDTHH:MM"
  onChange: (v: string) => void
  min?: string         // ISO datetime-local string
  placeholder?: string
  disabled?: boolean
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function pad(n: number) { return String(n).padStart(2, '0') }

function toLocal(iso: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
  if (!iso) return null
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  return { year: +m[1], month: +m[2] - 1, day: +m[3], hour: +m[4], minute: +m[5] }
}

function formatDisplay(iso: string): string {
  const p = toLocal(iso)
  if (!p) return ''
  const d = new Date(p.year, p.month, p.day)
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${pad(p.hour)}:${pad(p.minute)}`
}

export default function DateTimePicker({ value, onChange, min, placeholder = 'Pick date & time', disabled }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Parsed selected value
  const sel = toLocal(value)

  // Calendar navigation state
  const now = new Date()
  const [viewYear, setViewYear]   = useState(sel?.year  ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(sel?.month ?? now.getMonth())
  const [hour, setHour]     = useState(sel?.hour   ?? 12)
  const [minute, setMinute] = useState(sel?.minute ?? 0)

  // Sync view when value changes externally
  useEffect(() => {
    if (sel) {
      setViewYear(sel.year)
      setViewMonth(sel.month)
      setHour(sel.hour)
      setMinute(sel.minute)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const minParsed = toLocal(min ?? '')

  function isBeforeMin(year: number, month: number, day: number) {
    if (!minParsed) return false
    const d = year * 10000 + month * 100 + day
    const m = minParsed.year * 10000 + minParsed.month * 100 + minParsed.day
    return d < m
  }

  function selectDay(day: number) {
    const newVal = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
    onChange(newVal)
  }

  function updateTime(h: number, m: number) {
    if (!sel) return
    const newVal = `${sel.year}-${pad(sel.month + 1)}-${pad(sel.day)}T${pad(h)}:${pad(m)}`
    onChange(newVal)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build calendar days grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const displayText = value ? formatDisplay(value) : ''
  const isToday = (day: number) => {
    const t = new Date()
    return viewYear === t.getFullYear() && viewMonth === t.getMonth() && day === t.getDate()
  }
  const isSelected = (day: number) => sel && sel.year === viewYear && sel.month === viewMonth && sel.day === day

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-all text-left',
          'bg-sn-surface border-sn-border text-sn-white',
          'hover:border-sn-cyan/50 focus:outline-none focus:border-sn-cyan',
          open && 'border-sn-cyan ring-1 ring-sn-cyan/20',
          disabled && 'opacity-40 cursor-not-allowed',
        )}
      >
        <Calendar size={14} className={clsx('flex-shrink-0', displayText ? 'text-sn-cyan' : 'text-sn-muted')} />
        <span className={clsx('flex-1 truncate', displayText ? 'text-sn-white' : 'text-sn-muted')}>
          {displayText || placeholder}
        </span>
        {displayText && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange('') }}
            className="flex-shrink-0 text-sn-muted hover:text-sn-red transition-colors"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[300px] max-w-[340px] bg-sn-bg border border-sn-border rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sn-border">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-sn-surface transition-colors text-sn-muted hover:text-sn-white">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-sn-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-sn-surface transition-colors text-sn-muted hover:text-sn-white">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-sn-muted py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const disabled = isBeforeMin(viewYear, viewMonth, day)
              const selected = isSelected(day)
              const today = isToday(day)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={clsx(
                    'h-8 w-full rounded-lg text-xs font-medium transition-all',
                    selected
                      ? 'bg-sn-cyan text-sn-bg font-bold'
                      : today
                      ? 'bg-sn-surface text-sn-cyan border border-sn-cyan/40'
                      : 'text-sn-white hover:bg-sn-surface',
                    disabled && 'opacity-25 cursor-not-allowed hover:bg-transparent',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Time picker */}
          <div className="border-t border-sn-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-sn-muted flex-shrink-0" />
              <span className="text-xs text-sn-muted flex-shrink-0">Time</span>
              <div className="flex items-center gap-1 ml-auto">
                {/* Hour */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => { const h = (hour + 1) % 24; setHour(h); updateTime(h, minute) }}
                    className="text-sn-muted hover:text-sn-white transition-colors px-2"
                  >
                    <ChevronLeft size={12} className="rotate-90" />
                  </button>
                  <input
                    type="number"
                    min={0} max={23}
                    value={pad(hour)}
                    onChange={e => {
                      const h = Math.max(0, Math.min(23, +e.target.value || 0))
                      setHour(h); updateTime(h, minute)
                    }}
                    className="w-10 text-center bg-sn-surface border border-sn-border rounded-md text-sm text-sn-white py-1 focus:outline-none focus:border-sn-cyan [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => { const h = (hour + 23) % 24; setHour(h); updateTime(h, minute) }}
                    className="text-sn-muted hover:text-sn-white transition-colors px-2"
                  >
                    <ChevronLeft size={12} className="-rotate-90" />
                  </button>
                </div>

                <span className="text-sn-white font-bold text-lg mb-0.5">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => { const m = (minute + 5) % 60; setMinute(m); updateTime(hour, m) }}
                    className="text-sn-muted hover:text-sn-white transition-colors px-2"
                  >
                    <ChevronLeft size={12} className="rotate-90" />
                  </button>
                  <input
                    type="number"
                    min={0} max={59}
                    value={pad(minute)}
                    onChange={e => {
                      const m = Math.max(0, Math.min(59, +e.target.value || 0))
                      setMinute(m); updateTime(hour, m)
                    }}
                    className="w-10 text-center bg-sn-surface border border-sn-border rounded-md text-sm text-sn-white py-1 focus:outline-none focus:border-sn-cyan [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => { const m = (minute + 55) % 60; setMinute(m); updateTime(hour, m) }}
                    className="text-sn-muted hover:text-sn-white transition-colors px-2"
                  >
                    <ChevronLeft size={12} className="-rotate-90" />
                  </button>
                </div>
              </div>

              {/* Quick time presets */}
              <div className="flex flex-col gap-1 ml-2">
                {[[9,0],[12,0],[18,0],[21,0]].map(([h,m]) => (
                  <button
                    key={`${h}${m}`}
                    type="button"
                    onClick={() => { setHour(h); setMinute(m); updateTime(h, m) }}
                    className={clsx(
                      'text-[10px] px-2 py-0.5 rounded border transition-colors',
                      hour === h && minute === m
                        ? 'bg-sn-cyan/20 border-sn-cyan/40 text-sn-cyan'
                        : 'border-sn-border text-sn-muted hover:text-sn-white hover:border-sn-border/80'
                    )}
                  >
                    {pad(h)}:{pad(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <div className="px-4 pb-3">
            <button
              type="button"
              disabled={!value}
              onClick={() => setOpen(false)}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-sn-cyan text-sn-bg hover:bg-sn-cyan/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {value ? `Confirm — ${formatDisplay(value)}` : 'Select a date first'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
