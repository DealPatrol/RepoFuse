import { spawnSync } from 'node:child_process'
import { relative, resolve } from 'node:path'

const root = process.cwd()

// Existing lint debt on main as of 2026-09-27. CI fails when a file/rule pair
// exceeds this count, while allowing the separate cleanup work to land safely.
const allowedErrors = new Map([
  ['app/api/preview/route.ts:@typescript-eslint/no-explicit-any', 7],
  ['app/dashboard/build/page.tsx:react/no-unescaped-entities', 1],
  ['app/dashboard/completed/page.tsx:react/no-unescaped-entities', 2],
  ['app/dashboard/demand-insights/page.tsx:@typescript-eslint/no-explicit-any', 1],
  ['app/dashboard/projects/page.tsx:react-hooks/set-state-in-effect', 1],
  ['app/legal/eula/page.tsx:react/no-unescaped-entities', 1],
  ['components/LaunchPreview.tsx:@typescript-eslint/no-explicit-any', 1],
  ['components/LaunchPreview.tsx:@typescript-eslint/ban-ts-comment', 1],
  ['components/analysis-detail.tsx:react-hooks/set-state-in-effect', 1],
  ['components/connect-vercel.tsx:react-hooks/set-state-in-effect', 1],
  ['components/create-template-modal.tsx:react-hooks/immutability', 1],
  ['components/feature-education-banner.tsx:react/no-unescaped-entities', 5],
  ['components/gap-priority-matrix.tsx:@typescript-eslint/no-explicit-any', 2],
  ['components/most-desired-pro.tsx:react-hooks/set-state-in-effect', 1],
  ['components/testimonials.tsx:react/no-unescaped-entities', 2],
  ['lib/reddit-scraper.ts:@typescript-eslint/no-explicit-any', 1],
])

const lint = spawnSync(
  'pnpm',
  ['exec', 'eslint', '.', '--format', 'json'],
  { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
)

if (lint.error) {
  console.error(lint.error)
  process.exit(1)
}

let results
try {
  results = JSON.parse(lint.stdout)
} catch {
  console.error(lint.stderr || lint.stdout || 'ESLint did not return JSON output')
  process.exit(1)
}

const actualErrors = new Map()
let warningCount = 0

for (const result of results) {
  warningCount += result.warningCount
  const file = relative(root, resolve(result.filePath))

  for (const message of result.messages) {
    if (message.severity !== 2) continue
    const key = `${file}:${message.ruleId ?? 'unknown'}`
    actualErrors.set(key, (actualErrors.get(key) ?? 0) + 1)
  }
}

const regressions = []
for (const [key, count] of actualErrors) {
  const allowed = allowedErrors.get(key) ?? 0
  if (count > allowed) {
    regressions.push(`${key}: ${count} errors (baseline ${allowed})`)
  }
}

if (regressions.length > 0) {
  console.error('New ESLint errors exceed the main-branch baseline:')
  for (const regression of regressions) console.error(`- ${regression}`)
  process.exit(1)
}

const errorCount = [...actualErrors.values()].reduce((sum, count) => sum + count, 0)
console.log(
  `ESLint passed the regression baseline (${errorCount} known errors, ${warningCount} warnings).`,
)
