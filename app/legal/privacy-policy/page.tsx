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
              RepoFuse only accesses repositories and data authorized through GitHub OAuth. We store
              the OAuth access token needed to perform requested operations, repository metadata,
              analyzed file paths, and generated blueprints. We do not return OAuth tokens, passwords,
              or other authentication secrets to AI assistants.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Third-Party Services</h2>
            <p className="text-foreground">
              RepoFuse uses GitHub for repository access, Clerk for authentication and OAuth,
              Stripe for payments, Neon for database hosting, Vercel for application hosting and AI
              gateway services, and configured AI model providers such as Anthropic or OpenAI to
              generate analyses and scaffolds. Requests sent to AI providers include the repository
              names, file paths, blueprint details, and prompts needed to complete the requested task.
              Each provider processes data under its own privacy terms.
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
              <li>Revoke an AI assistant&apos;s RepoFuse OAuth connection at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. MCP and AI Assistants</h2>
            <p className="text-foreground">
              When you connect Claude, ChatGPT, Cursor, or another MCP client, RepoFuse receives
              OAuth identity and tool requests from that client. Tool responses may contain repository
              names and URLs, file paths, technology choices, and generated blueprint or scaffold
              content. RepoFuse applies the same account permissions, plan limits, credits, and rate
              limits used by the website. RepoFuse does not receive or store the surrounding assistant
              conversation unless it is included in a tool argument.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Data Retention and Deletion</h2>
            <p className="text-foreground">
              Account, repository metadata, analyses, blueprints, billing records, and usage records
              are retained while your account is active and as needed for security, billing, legal,
              and fraud-prevention obligations. Repository source content used during an analysis is
              processed to answer the request and is not stored as complete source files. You may
              request account deletion at privacy@repofuse.com. We delete or de-identify eligible data
              within 30 days, except records that must be retained by law or for legitimate billing
              and security purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Cookies and Tracking</h2>
            <p className="text-foreground">
              RepoFuse uses cookies and similar technologies to maintain sessions, remember preferences, and analyze usage patterns. You can control cookie settings in your browser.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-foreground">
              RepoFuse is not intended for users under 13. We do not knowingly collect data from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-foreground">
              We may update this Privacy Policy periodically. We will notify you of significant changes by email or through the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
            <p className="text-foreground">
              For privacy concerns, contact: privacy@repofuse.com
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
