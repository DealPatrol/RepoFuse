import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function assertIncludes(path, needle, message) {
  const text = read(path)
  if (!text.includes(needle)) {
    throw new Error(`${message}\nMissing in ${path}: ${needle}`)
  }
}

function assertNotIncludes(path, needle, message) {
  const text = read(path)
  if (text.includes(needle)) {
    throw new Error(`${message}\nUnexpected in ${path}: ${needle}`)
  }
}

assertIncludes(
  'app/api/code-completion/route.ts',
  "import { getCurrentUser } from '@/lib/auth'",
  'code-completion must require an authenticated user',
)
assertIncludes(
  'app/api/code-completion/route.ts',
  'WHERE r.user_id = ${userId}',
  'code-completion fallback snippets must be scoped to the authenticated user',
)

assertIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  'const user = await getCurrentUser()',
  'legacy analysis must authenticate before billing or AI work',
)
assertNotIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  'userId: string',
  'legacy analysis must not trust a client-supplied userId',
)

assertIncludes(
  'lib/queries.ts',
  'AND p.user_id = ${userId}',
  'milestone mutations must be scoped through project ownership',
)
assertIncludes(
  'app/api/projects/[id]/milestones/[milestoneId]/route.ts',
  'toggleMilestone(id, milestoneId, user.id',
  'milestone route must pass project id and authenticated user id',
)

assertNotIncludes(
  'app/api/analyses/[id]/run/route.ts',
  'deleteBlueprintsByAnalysis(id)',
  'analysis reruns must not delete existing blueprints before replacement rows are created',
)
assertIncludes(
  'app/api/analyses/[id]/run/route.ts',
  'deleteBlueprintsByAnalysisExcept(id, user.id, createdBlueprintIds)',
  'analysis reruns must delete old blueprints only after replacements are inserted',
)
assertIncludes(
  'app/api/analyses/[id]/run/route.ts',
  'reserveAnalysisUsage(user.github_id, limit)',
  'free-tier analysis usage must be reserved atomically before AI work',
)
assertIncludes(
  'app/api/analyses/[id]/run/route.ts',
  'releaseAnalysisUsage(reservedUsageGithubId)',
  'failed free-tier analysis runs must release reserved usage',
)

assertIncludes(
  'app/api/build-app/route.ts',
  'private: true',
  'Build This App must create GitHub repos private by default',
)
assertNotIncludes(
  'app/api/build-app/route.ts',
  '# Error generating',
  'Build This App must not push placeholder files after generation failures',
)
assertIncludes(
  'app/api/build-app/route.ts',
  "throw new Error(`Failed to push ${path}:",
  'Build This App must fail the stream when GitHub pushes fail',
)
assertIncludes(
  'app/api/build-app/route.ts',
  'refundCredits(chargedUserId, CREDITS.BUILD_APP_COST',
  'Build This App must refund incomplete builds',
)

assertIncludes(
  'lib/credits.ts',
  'AND current_balance >= ${amount}',
  'credit deductions must be atomic and balance-guarded',
)
assertIncludes(
  'lib/credits.ts',
  'idempotency_key',
  'credit grants and renewals must support Stripe webhook idempotency',
)
assertIncludes(
  'migrations/009_credit_transaction_idempotency.sql',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_idempotency_key',
  'credit idempotency migration must enforce a unique key',
)

console.log('critical regression invariants passed')
