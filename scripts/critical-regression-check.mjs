import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function assertIncludes(path, needle, message) {
  const text = read(path)
  if (!text.includes(needle)) {
    throw new Error(`${message}\nExpected ${path} to include: ${needle}`)
  }
}

function assertExcludes(path, needle, message) {
  const text = read(path)
  if (text.includes(needle)) {
    throw new Error(`${message}\nExpected ${path} not to include: ${needle}`)
  }
}

function assertMatches(path, pattern, message) {
  const text = read(path)
  if (!pattern.test(text)) {
    throw new Error(`${message}\nExpected ${path} to match: ${pattern}`)
  }
}

assertMatches(
  'app/api/projects/[id]/milestones/[milestoneId]/route.ts',
  /toggleMilestone\(milestoneId,\s*id,\s*user\.id,/,
  'Milestone PATCH must scope by route project and authenticated user.',
)
assertMatches(
  'app/api/projects/[id]/milestones/[milestoneId]/route.ts',
  /deleteMilestone\(milestoneId,\s*id,\s*user\.id\)/,
  'Milestone DELETE must scope by route project and authenticated user.',
)
assertIncludes(
  'lib/queries.ts',
  'projects.user_id = ${userId}',
  'Milestone helper SQL must enforce project ownership.',
)

assertIncludes(
  'app/api/code-completion/route.ts',
  "import { getCurrentUser } from '@/lib/auth'",
  'Code completion must authenticate API callers.',
)
assertIncludes(
  'app/api/code-completion/route.ts',
  'JOIN repositories r ON r.id = rf.repository_id',
  'Code completion fallback snippets must join repositories for ownership scope.',
)
assertIncludes(
  'app/api/code-completion/route.ts',
  'WHERE r.user_id = ${userId}',
  'Code completion fallback snippets must be scoped to the authenticated user.',
)

assertIncludes(
  'app/api/generate-scaffold/route.ts',
  "deductCredits(user.id, CREDITS.SCAFFOLD_COST, 'scaffold'",
  'Scaffold generation must bill the authenticated user.',
)
assertIncludes(
  'app/api/generate-scaffold/route.ts',
  "refundCredits(user.id, CREDITS.SCAFFOLD_COST, 'scaffold generation failed'",
  'Scaffold generation failures after billing must refund credits.',
)
assertExcludes(
  'app/api/generate-scaffold/route.ts',
  'deductCredits(userId',
  'Scaffold generation must not trust a client-supplied userId.',
)

assertIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  "import { getCurrentUser } from '@/lib/auth'",
  'Legacy analyze must authenticate callers.',
)
assertIncludes(
  'app/api/analyses/[id]/analyze/route.ts',
  "deductCredits(user.id, CREDITS.ANALYSIS_COST, 'analysis'",
  'Legacy analyze must bill the authenticated user.',
)
assertExcludes(
  'app/api/analyses/[id]/analyze/route.ts',
  'userId: string',
  'Legacy analyze must not accept a client-controlled billing userId.',
)

assertIncludes(
  'app/api/app-idea-chat/route.ts',
  "refundCredits(\n        user.id,\n        CREDITS.PATTERN_ANALYZER_COST,\n        'app idea chat failed'",
  'App Idea Chat failures after billing must refund credits.',
)
assertIncludes(
  'app/api/pattern-analyzer/route.ts',
  "refundCredits(\n        user.id,\n        CREDITS.PATTERN_ANALYZER_COST,\n        'pattern analyzer failed'",
  'Pattern Analyzer failures after billing must refund credits.',
)

assertExcludes(
  'app/api/analyses/[id]/run/route.ts',
  'deleteBlueprintsByAnalysis(id)',
  'Analysis reruns must not delete old blueprints before replacements are ready.',
)
assertIncludes(
  'app/api/analyses/[id]/run/route.ts',
  'replaceBlueprintsForAnalysis(',
  'Analysis reruns must use atomic blueprint replacement.',
)
assertIncludes(
  'lib/queries.ts',
  'await sql.transaction([',
  'Blueprint replacement must run delete and insert in one database transaction.',
)

assertIncludes(
  'app/api/build-app/route.ts',
  'private: true',
  'Build-app GitHub repositories must be private by default.',
)
assertIncludes(
  'app/api/build-app/route.ts',
  "deductCredits(user.id, CREDITS.BUILD_APP_COST, 'build_app'",
  'Build-app must bill the authenticated user before AI work.',
)
assertIncludes(
  'app/api/build-app/route.ts',
  "await refundBuildCredits('build app failed'",
  'Build-app failures after billing must refund credits.',
)
assertExcludes(
  'app/api/build-app/route.ts',
  'content = `# Error generating',
  'Build-app must not push error stub files after generation failures.',
)
assertMatches(
  'app/api/build-app/route.ts',
  /if \(!res\.ok\) \{\s*const err = \(await res\.json\(\)\).*throw new Error\(`Failed to push/s,
  'Build-app push failures must throw instead of warning and continuing.',
)

assertIncludes(
  'lib/credits.ts',
  'AND current_balance >= ${amount}',
  'Credit deductions must be atomic and conditional on sufficient balance.',
)
assertIncludes(
  'lib/credits.ts',
  'SET current_balance = current_balance + ${amount}',
  'Credit refunds must update balances atomically.',
)

console.log('Critical regression checks passed')
