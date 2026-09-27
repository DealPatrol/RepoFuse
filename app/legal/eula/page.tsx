export const metadata = {
  title: 'RepoFuse Terms of Service',
  description: 'Terms of Service for RepoFuse',
}

export default function EulaPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground mb-6">
            <strong>Last Updated: May 2026</strong>
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. License Grant</h2>
            <p className="text-foreground">
              RepoFuse grants you a limited, non-exclusive, non-transferable license to use the RepoFuse platform and services in accordance with this Agreement and applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Restrictions</h2>
            <p className="text-foreground mb-4">You may not:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Reverse engineer or attempt to gain unauthorized access</li>
              <li>Redistribute or resell the service</li>
              <li>Use the service for unlawful purposes</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the platform&apos;s operations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <p className="text-foreground">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify RepoFuse immediately of any unauthorized use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Intellectual Property</h2>
            <p className="text-foreground">
              The RepoFuse platform, including all code, features, and functionality, is owned by RepoFuse and protected by intellectual property laws. Your generated content and ideas remain your property.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Connected Assistants and GitHub Actions</h2>
            <p className="text-foreground">
              You may connect supported AI assistants through RepoFuse&apos;s MCP server. You remain
              responsible for reviewing tool requests and generated output. Read-only tools may access
              repository metadata and code paths. A repository-creation tool can create and populate a
              new GitHub repository only when requested through your authorized account. RepoFuse does
              not guarantee that generated code is correct, secure, or fit for production use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Plans, Credits, and Limits</h2>
            <p className="text-foreground">
              Features may be subject to subscription eligibility, monthly limits, credits, and rate
              limits. Credits have no cash value and are consumed when an eligible generation starts;
              RepoFuse may restore credits when a generation fails. Current plan details and prices are
              shown before purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-foreground">
              RepoFuse is provided &quot;as is&quot; without warranties of any kind, express or implied, including but not limited to warranties of merchantability or fitness for a particular purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-foreground">
              RepoFuse shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <p className="text-foreground">
              RepoFuse may terminate your account at any time if you violate this Agreement or for any reason with notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-foreground">
              RepoFuse reserves the right to modify this Agreement at any time. Continued use constitutes acceptance of changes.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
