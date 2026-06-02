'use client'

import { ReactNode, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'
import { LaunchSignup } from './launch-signup'
import { X } from 'lucide-react'

interface LaunchSignupModalProps {
  children: ReactNode
}

export function LaunchSignupModal({ children }: LaunchSignupModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-black border-cyan-500/30 text-white">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <LaunchSignup onComplete={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
