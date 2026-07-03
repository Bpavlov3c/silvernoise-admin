'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login, isAuthenticated } from '@/lib/auth'

interface FormData {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>()

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard')
  }, [router])

  async function onSubmit(data: FormData) {
    setError('')
    try {
      await login(data.email, data.password)
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-sn-black flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--sn-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--sn-cyan) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sn-cyan to-sn-purple flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8 L5 4 L8 10 L11 6 L14 8"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-sn-white">
              SILVERNOISE
            </span>
          </div>
          <p className="text-xs text-sn-muted tracking-widest uppercase">Admin Central</p>
        </div>

        {/* Card */}
        <div className="sn-card p-8">
          <h1 className="text-lg font-semibold text-sn-white mb-1">Sign in</h1>
          <p className="text-sm text-sn-muted mb-6">Internal access only</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="sn-label">Email</label>
              <input
                {...register('email', { required: true })}
                type="email"
                className="sn-input"
                placeholder="admin@silvernoise.net"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="sn-label">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: true })}
                  type={showPass ? 'text' : 'password'}
                  className="sn-input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sn-muted hover:text-sn-white transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="sn-btn-primary w-full justify-center mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-sn-muted mt-6">
          Silvernoise Admin · Internal use only
        </p>
      </div>
    </div>
  )
}
