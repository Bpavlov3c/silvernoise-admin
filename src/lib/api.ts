const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://silvernoise-api.on-forge.com/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sn_admin_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sn_admin_token')
      localStorage.removeItem('sn_admin_user')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`)
  }

  return data as T
}

// ── Auth ──────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/auth/me'),
}

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboard = {
  get: () => request<DashboardData>('/admin/dashboard'),
}

// ── Customers ─────────────────────────────────────────────────────
export const customers = {
  list: (params?: string) => request<PaginatedResponse<Customer>>(`/admin/customers${params ? `?${params}` : ''}`),
  get:  (id: number) => request<{ data: Customer }>(`/admin/customers/${id}`),
  create: (data: Partial<Customer> & { password?: string }) => request<{ data: Customer }>('/admin/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Customer> & { password?: string }) => request<{ data: Customer }>(`/admin/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activate:   (id: number) => request(`/admin/customers/${id}/activate`, { method: 'POST' }),
  deactivate: (id: number) => request(`/admin/customers/${id}/deactivate`, { method: 'POST' }),
  block:      (id: number) => request(`/admin/customers/${id}/block`, { method: 'POST' }),
  resetPassword: (id: number) => request(`/admin/customers/${id}/reset-password`, { method: 'POST' }),
  toggleFeatured: (id: number) => request(`/admin/customers/${id}/feature`, { method: 'POST' }),
}

// ── Labels ────────────────────────────────────────────────────────
export const labels = {
  list: (params?: string) => request<PaginatedResponse<Label>>(`/admin/labels${params ? `?${params}` : ''}`),
  get:  (id: number) => request<{ data: Label }>(`/admin/labels/${id}`),
  create: (data: Partial<Label>) => request<{ data: Label }>('/admin/labels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Label>) => request<{ data: Label }>(`/admin/labels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assign: (labelId: number, customerId: number) =>
    request<{ message: string }>(`/admin/labels/${labelId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId }),
    }),
  unassign: (labelId: number, customerId: number) =>
    request<{ message: string }>(`/admin/labels/${labelId}/unassign`, {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId }),
    }),
}

// ── Releases ──────────────────────────────────────────────────────
export const releases = {
  list: (params?: string) => request<PaginatedResponse<Release>>(`/admin/releases${params ? `?${params}` : ''}`),
  get:  (id: number) => request<{ data: Release }>(`/admin/releases/${id}`),
  create: (data: Partial<Release>) => request<{ data: Release }>('/admin/releases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Release>) => request<{ data: Release }>(`/admin/releases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) => request(`/admin/releases/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
}

// ── Reports ───────────────────────────────────────────────────────
export const reports = {
  list: (params?: string) => request<PaginatedResponse<Report>>(`/admin/reports${params ? `?${params}` : ''}`),
  get:  (id: number) => request<{ data: Report }>(`/admin/reports/${id}`),
  create: (data: Partial<Report>) => request<{ data: Report }>('/admin/reports', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Report>) => request<{ data: Report }>(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  destroy: (id: number) => request(`/admin/reports/${id}`, { method: 'DELETE' }),
}

// ── Payments ──────────────────────────────────────────────────────
export const payments = {
  list: (params?: string) => request<PaginatedResponse<PaymentRequest>>(`/admin/payments${params ? `?${params}` : ''}`),
  get:  (id: number) => request<{ data: PaymentRequest }>(`/admin/payments/${id}`),
  updateStatus: (id: number, status: string) => request(`/admin/payments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
}

// ── API Logs & KVZ ───────────────────────────────────────────────
export const apiLogs = {
  list: (params?: string) =>
    request<PaginatedResponse<ApiLog>>(`/admin/api-logs${params ? `?${params}` : ''}`),
}

export const kvz = {
  sync: () => request<{ message: string }>('/admin/kvz/sync', { method: 'POST' }),
}

// ── Email Templates ───────────────────────────────────────────────
export const emailTemplates = {
  list: () => request<EmailTemplate[]>('/admin/email-templates'),
  get:  (key: string) => request<EmailTemplate>(`/admin/email-templates/${key}`),
  update: (key: string, data: Partial<Pick<EmailTemplate, 'subject_bg' | 'subject_en' | 'body_bg' | 'body_en'>>) =>
    request<EmailTemplate>(`/admin/email-templates/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendTest: (key: string, email: string, lang: 'bg' | 'en') =>
    request<{ message: string }>(`/admin/email-templates/${key}/test`, {
      method: 'POST',
      body: JSON.stringify({ email, lang }),
    }),
}

// ── Newsletters ───────────────────────────────────────────────────
export const newsletters = {
  list: (params?: string) => request<PaginatedResponse<NewsletterCampaign>>(`/admin/newsletters${params ? `?${params}` : ''}`),
  get:  (id: number) => request<NewsletterCampaign>(`/admin/newsletters/${id}`),
  create: (data: Partial<NewsletterCampaign>) =>
    request<NewsletterCampaign>('/admin/newsletters', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<NewsletterCampaign>) =>
    request<NewsletterCampaign>(`/admin/newsletters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  send: (id: number) =>
    request<{ message: string }>(`/admin/newsletters/${id}/send`, { method: 'POST' }),
  schedule: (id: number, scheduledAt: string) =>
    request<{ message: string; scheduled_at: string }>(`/admin/newsletters/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    }),
  destroy: (id: number) =>
    request<{ message: string }>(`/admin/newsletters/${id}`, { method: 'DELETE' }),
}

// -- Email Log --
export const emailLog = {
  list: (params?: string) => request<PaginatedResponse<EmailLogEntry>>(`/admin/email-log${params ? `?${params}` : ''}`),
}

// -- Helpers --
// Cover art from KVZ requires server-side auth -- use this proxy URL in <img> tags.
export function coverArtUrl(releaseId: number): string {
  return `${BASE}/releases/${releaseId}/cover-art`
}

// -- Types --
export interface User {
  id: number
  name: string
  surname: string
  full_name: string
  email: string
  role: 'admin' | 'seller' | 'finance'
  is_active: boolean
  is_blocked: boolean
  featured: boolean
  customer_type: 'individual' | 'company' | null
  company_name: string | null
  created_at: string
}

export interface Customer extends User {
  labels?: Label[]
  releases?: Release[]
}

export interface Label {
  id: number
  name: string
  slug?: string
  description?: string
  releases_count?: number
  customers?: Customer[]
  created_at: string
}

export interface Release {
  id: number
  title: string
  catalog_id: string | null
  upc: string | null
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'live' | 'takedown'
  original_release_date: string | null
  cover_art_url: string | null
  label?: Label
  customer?: Customer
  created_at: string
}

export interface Report {
  id: number
  report_name: string
  report_date: string
  report_period: string
  status: 'paid' | 'unpaid'
  label?: Label
  customer?: Customer
  created_at: string
}

export interface PaymentRequest {
  id: number
  amount: number
  currency: string
  status: 'pending' | 'sent'
  payment_method: string | null
  requested_at: string
  customer?: Customer
  report?: Report
  created_at: string
}

export interface DashboardData {
  stats: {
    total_customers: number
    active_customers: number
    total_labels: number
    total_releases: number
    live_releases: number
    pending_releases: number
    total_tracks: number
    unpaid_reports: number
    pending_payments: number
    total_earnings_eur: number
    pending_earnings_eur: number
  }
  recent_releases: Release[]
  payment_queue: PaymentRequest[]
}

export interface ApiLog {
  id: number
  source: string
  endpoint: string
  method: string
  status_code: number | null
  response_time_ms: number | null
  error_message: string | null
  triggered_by: { id: number; name: string; surname: string } | null
  created_at: string
}

export interface EmailTemplate {
  id: number
  key: string
  name: string
  subject_bg: string
  subject_en: string
  body_bg: string
  body_en: string
  variables: string[]
  updated_at: string
}

export interface NewsletterCampaign {
  id: number
  subject_bg: string
  subject_en: string
  body_bg: string
  body_en: string
  segment: 'all' | 'active' | 'inactive' | 'artists' | 'labels'
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  scheduled_at: string | null
  sent_at: string | null
  recipients_count: number | null
  created_by: number
  creator?: { id: number; name: string; surname: string }
  created_at: string
}

export interface EmailLogEntry {
  id: number
  user_id: number | null
  template_key: string | null
  campaign_id: number | null
  to_email: string
  subject: string
  status: 'sent' | 'failed'
  error_message: string | null
  sent_at: string
  user?: { id: number; name: string; surname: string; email: string }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
