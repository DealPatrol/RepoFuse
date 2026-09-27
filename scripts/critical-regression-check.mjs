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
assertIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  'getAnalysisById(analysisId, user.id)',
  'legacy analysis must verify ownership before billing or AI work',
)
assertIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  'getRepositoriesForAnalysis(analysisId, user.id)',
  'legacy analysis must use repositories linked to the owned analysis',
)
assertNotIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  'userId: string',
  'legacy analysis must not trust a client-supplied userId',
)

assertIncludes(
  'app/api/analyze/route.ts',
  'const user = await getCurrentUser()',
  'cross-platform analysis must require an authenticated user',
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

assertIncludes(
  'app/api/auth/vercel/callback/route.ts',
  'UPDATE user_auth',
  'Vercel OAuth must persist credentials to the application user table',
)
assertIncludes(
  'app/api/auth/vercel/disconnect/route.ts',
  'UPDATE user_auth',
  'Vercel disconnect must clear credentials from the application user table',
)
assertNotIncludes(
  'scripts/01-create-schema.sql',
  "plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'byok', 'pro', 'scale'))",
  'fresh schema must not declare the subscriptions plan column twice',
)
assertIncludes(
  'scripts/01-create-schema.sql',
  'CREATE TABLE IF NOT EXISTS user_credits',
  'fresh schema must create credit balances',
)
assertIncludes(
  'scripts/01-create-schema.sql',
  'idx_credit_transactions_idempotency_key',
  'fresh schema must enforce idempotent credit transactions',
)
assertIncludes(
  'app/api/setup/init-db/route.ts',
  "process.env.NODE_ENV === 'production'",
  'database initialization must be disabled in production',
)
assertIncludes(
  'app/api/auth/debug/route.ts',
  "process.env.NODE_ENV === 'production'",
  'the auth diagnostic endpoint must be disabled in production',
)
assertNotIncludes(
  'lib/api-key-encryption.ts',
  "|| 'default-secret'",
  'API key encryption must not fall back to a shared default secret',
)
assertNotIncludes(
  'app/api/reddit/sync/route.ts',
  "|| 'default-secret'",
  'cron authentication must not fall back to a shared default secret',
)
assertIncludes(
  'app/api/github/create-repo/route.ts',
  'privateRepo: true',
  'generated GitHub repositories must be private by default',
)
assertIncludes(
  'app/api/analyses/[id]/route.ts',
  'applyBlueprintAccess(user, blueprints)',
  'analysis API responses must mask locked blueprint internals',
)
assertIncludes(
  'app/api/analyses/[id]/blueprints/route.ts',
  'applyBlueprintAccess(user, blueprints)',
  'blueprint API responses must mask locked blueprint internals',
)

console.log('critical regression invariants passed')
