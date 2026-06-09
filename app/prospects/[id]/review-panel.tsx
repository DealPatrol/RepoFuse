'use client'

import { useState } from 'react'
import { CheckCircle2, Clipboard, MailCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProspectStatus } from '@/lib/prospect-engine/types'

interface ReviewPanelProps {
  initialStatus: ProspectStatus
  subject: string
  body: string
}

export function ReviewPanel({ initialStatus, subject, body }: ReviewPanelProps) {
  const [status, setStatus] = useState<ProspectStatus>(initialStatus)
  const [copied, setCopied] = useState(false)

  async function copyMessage() {
    const message = `Subject: ${subject}\n\n${body}`

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Manual review status</p>
        <p className="mt-1 text-lg font-semibold capitalize">{status}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => setStatus('approved')} className="justify-start">
          <CheckCircle2 className="h-4 w-4" />
          Approve draft
        </Button>
        <Button type="button" variant="secondary" onClick={() => setStatus('contacted')} className="justify-start">
          <MailCheck className="h-4 w-4" />
          Mark contacted
        </Button>
        <Button type="button" variant="outline" onClick={copyMessage} className="justify-start">
          <Clipboard className="h-4 w-4" />
          {copied ? 'Copied' : 'Copy message'}
        </Button>
        <Button type="button" variant="destructive" onClick={() => setStatus('rejected')} className="justify-start">
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        This prototype never sends messages automatically. Use Copy Message only after manually reviewing the prospect
        and confirming the contact channel is appropriate.
      </p>
    </div>
  )
}
