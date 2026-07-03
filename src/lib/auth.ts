import { auth, type User } from './api'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sn_admin_token')
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('sn_admin_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setSession(token: string, user: User): void {
  localStorage.setItem('sn_admin_token', token)
  localStorage.setItem('sn_admin_user', JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem('sn_admin_token')
  localStorage.removeItem('sn_admin_user')
}

export async function login(email: string, password: string): Promise<User> {
  const res = await auth.login(email, password)
  if (res.user.role !== 'admin' && res.user.role !== 'finance') {
    throw new Error('Access denied: admin role required')
  }
  setSession(res.token, res.user)
  return res.user
}

export async function logout(): Promise<void> {
  try {
    await auth.logout()
  } catch {
    // token already invalid — still clear local state
  } finally {
    clearSession()
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredToken()
}
