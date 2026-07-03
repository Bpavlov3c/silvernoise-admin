import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { AuthGuard } from '@/components/AuthGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 min-h-screen bg-sn-black">
        <div className="p-6">
          {children}
        </div>
      </main>
    </AuthGuard>
  )
}
