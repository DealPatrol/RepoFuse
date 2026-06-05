import { getCurrentUser } from '@/lib/auth'
import { DashboardSidebar } from '@/components/dashboard-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    user = await getCurrentUser()
  } catch {
    // DB unavailable — render unauthenticated state
  }

  return (
    <div className="flex h-screen bg-[#0D1117]">
      {/* Sidebar */}
      <DashboardSidebar user={user ? {
        name: user.name || 'Developer',
        email: user.email,
        plan: 'pro'
      } : undefined} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
