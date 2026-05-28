export const metadata = {
  title: 'RepoFuse Privacy Policy',
  description: 'Privacy Policy for RepoFuse',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground mb-6">
            <strong>Last Updated: May 2026</strong>
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-foreground mb-4">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Account Information:</strong> Name, email, GitHub username</li>
              <li><strong>GitHub Data:</strong> Repository data, code patterns, and metadata</li>
              <li><strong>Usage Data:</strong> Features used, analysis performed, credits consumed</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-foreground">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Provide and improve the RepoFuse service</li>
              <li>Authenticate users and secure accounts</li>
              <li>Analyze repositories and generate insights</li>
              <li>Send service updates and support communications</li>
              <li>Improve platform performance and features</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
            <p className="text-foreground">
              We implement industry-standard security measures including encryption, secure authentication, and access controls to protect your data. However, no system is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. GitHub Data Privacy</h2>
            <p className="text-foreground">
              RepoFuse only accesses the repositories and data you explicitly authorize through GitHub OAuth. We do not store your GitHub credentials and only retain necessary metadata for analysis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Third-Party Services</h2>
            <p className="text-foreground">
              RepoFuse uses third-party services including GitHub, Stripe for payments, and Neon for database hosting. Each service has its own privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-foreground mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Opt-out of communications</li>
              <li>Revoke GitHub authorization at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p className="text-foreground">
              RepoFuse uses cookies and similar technologies to maintain sessions, remember preferences, and analyze usage patterns. You can control cookie settings in your browser.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-foreground">
              RepoFuse is not intended for users under 13. We do not knowingly collect data from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>
            <p className="text-foreground">
              We may update this Privacy Policy periodically. We will notify you of significant changes by email or through the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="text-foreground">
              For privacy concerns, contact: privacy@repofuse.com
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
