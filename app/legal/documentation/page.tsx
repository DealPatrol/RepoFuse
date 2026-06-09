export const metadata = {
  title: 'RepoFuse Documentation - Integration Guide',
  description: 'Complete documentation for RepoFuse integration',
}

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">RepoFuse Documentation</h1>
        
        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <p className="mb-4">
              RepoFuse is an AI-powered platform that scans GitHub and GitLab repositories to surface project ideas and build plans based on your existing codebase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Repository scanning and analysis</li>
              <li>Codebase pattern recognition</li>
              <li>AI-powered project idea generation</li>
              <li>Build plan scaffolding</li>
              <li>VibeCoding Chat for interactive development</li>
              <li>Credit-based system for API usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Integration Setup</h2>
            <p className="mb-4">
              RepoFuse integrates with GitHub OAuth to authenticate users and access their repositories. Follow these steps to set up:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Sign up for a RepoFuse account</li>
              <li>Connect your GitHub account via OAuth</li>
              <li>Select repositories to analyze</li>
              <li>Start getting project ideas and build plans</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">API Credits</h2>
            <p>
              RepoFuse uses a credit-based system. Pro includes 3,000 credits/month and Scale includes 12,000 credits/month. Monthly renewals top your balance up to the plan allowance instead of stacking unused credits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Support</h2>
            <p>
              For support, contact us through the RepoFuse dashboard or email support@repofuse.com
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
