import { Mail, MessageSquare, AlertCircle, Github } from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Support & Help</h1>
          <p className="text-lg text-muted-foreground">
            We&apos;re here to help. Choose the best way to get support for RepoFuse.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Email Support */}
          <div className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Email Support</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Send us an email with your question or issue and we&apos;ll respond within 24 hours.
            </p>
            <a
              href="mailto:support@repofuse.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Email Support
            </a>
          </div>

          {/* GitHub Issues */}
          <div className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Github className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">GitHub Issues</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Report bugs or request features on our GitHub repository. Join the community discussion.
            </p>
            <a
              href="https://github.com/DealPatrol/RepoFuse/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Open Issue on GitHub
            </a>
          </div>

          {/* Documentation */}
          <div className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Documentation</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Browse our comprehensive documentation to find answers to common questions.
            </p>
            <a
              href="/legal/documentation"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              View Documentation
            </a>
          </div>

          {/* FAQ */}
          <div className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">FAQ</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Check our frequently asked questions to get quick answers to common topics.
            </p>
            <a
              href="#faq"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Browse FAQ
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mt-16 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold mb-2">How do I get started with RepoFuse?</h3>
              <p className="text-muted-foreground">
                Sign up with your GitHub account, connect your repositories, and RepoFuse will analyze your code to suggest build ideas and generate scaffolding.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold mb-2">Is my code safe?</h3>
              <p className="text-muted-foreground">
                Yes, RepoFuse only reads your public repository code for analysis. We never store or modify your source code. Read our privacy policy for more details.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-muted-foreground">
                Absolutely! You can cancel your subscription at any time from your account settings. You won&apos;t be charged for future billing periods.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express), Apple Pay, and other payment methods supported by Stripe.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold mb-2">Do you offer enterprise plans?</h3>
              <p className="text-muted-foreground">
                Yes! For enterprise solutions, custom integrations, or dedicated support, please contact us at support@repofuse.com.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 p-8 rounded-lg bg-accent/10 border border-accent/20">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is ready to help. Don&apos;t hesitate to reach out!
          </p>
          <a
            href="mailto:support@repofuse.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-semibold"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
