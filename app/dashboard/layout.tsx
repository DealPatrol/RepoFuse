import { getCurrentUser } from '@/lib/auth'
import { DashboardSidebar, DashboardMobileNav } from '@/components/dashboard-sidebar'

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
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar user={user} />
      <DashboardMobileNav user={user} />
      {/* Collapsed sidebar is 4rem (w-16); leave room for it on desktop. */}
      <div className="md:pl-16">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
