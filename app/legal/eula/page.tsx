export const metadata = {
  title: 'RepoFuse EULA - End User License Agreement',
  description: 'End User License Agreement for RepoFuse',
}

export default function EulaPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">End User License Agreement</h1>
        
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
              <li>Interfere with the platform's operations</li>
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
            <h2 className="text-2xl font-bold mb-4">5. Disclaimer of Warranties</h2>
            <p className="text-foreground">
              RepoFuse is provided &quot;as is&quot; without warranties of any kind, express or implied, including but not limited to warranties of merchantability or fitness for a particular purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
            <p className="text-foreground">
              RepoFuse shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Termination</h2>
            <p className="text-foreground">
              RepoFuse may terminate your account at any time if you violate this Agreement or for any reason with notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Changes to Terms</h2>
            <p className="text-foreground">
              RepoFuse reserves the right to modify this Agreement at any time. Continued use constitutes acceptance of changes.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
