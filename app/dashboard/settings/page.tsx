// app/dashboard/settings/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { APIKeyManager } from '@/components/api-key-manager'
import { ConnectVercel } from '@/components/connect-vercel'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please sign in to access settings.</p>
      </div>
    )
  }

  const isVercelConnected = !!user.vercel_access_token

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">Account</h2>
            <p className="text-muted-foreground">GitHub ID: {user.github_id}</p>
          </div>

          <div className="border-t border-border/50 pt-8">
            <h2 className="text-lg font-semibold mb-4">Integrations</h2>
            <div className="rounded-lg border border-border/50 p-4">
              <ConnectVercel isConnected={isVercelConnected} />
            </div>
          </div>

          <div className="border-t border-border/50 pt-8">
            <APIKeyManager />
          </div>
        </div>
      </div>
    </div>
  )
}
