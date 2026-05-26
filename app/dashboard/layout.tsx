import { getCurrentUser } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard-header'

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
      <DashboardHeader user={user} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {children}
      </main>
    </div>
  )
}
