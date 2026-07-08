import { getDb } from './db'

// Types
export interface UserBillingUpdate {
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  stripe_price_id?: string | null
  plan_tier?: 'free' | 'pro' | 'scale' | 'byok' | null
  subscription_status?: string | null
}

export interface Repository {
  id: string
  user_id: string | null
  github_id: number
  name: string
  full_name: string
  description: string | null
  url: string
  default_branch: string
  language: string | null
  stars: number
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface RepoFile {
  id: string
  repository_id: string
  path: string
  name: string
  extension: string | null
  size_bytes: number | null
  file_type: string | null
  purpose: string | null
  technologies: string[]
  exports: string[]
  imports: string[]
  reusability_score: number
  ai_summary: string | null
  content_hash: string | null
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  user_id: string | null
  name: string
  status: 'pending' | 'scanning' | 'analyzing' | 'complete' | 'failed'
  total_files: number
  analyzed_files: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AppBlueprint {
  id: string
  analysis_id: string
  user_id: string | null
  name: string
  description: string | null
  app_type: string | null
  complexity: 'simple' | 'moderate' | 'complex'
  reuse_percentage: number
  existing_files: { path: string; purpose: string }[]
  missing_files: { name: string; purpose: string }[]
  estimated_effort: string | null
  technologies: string[]
  ai_explanation: string | null
  created_at: string
}

type BlueprintInsert = Omit<AppBlueprint, 'id' | 'created_at'>

// Subscription types & queries
export interface Subscription {
  id: string
  github_id: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'byok' | 'pro' | 'scale'
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
  current_period_end: string | null
  analyses_used_this_month: number
  billing_cycle_anchor: string
  created_at: string
  updated_at: string
}

export async function getSubscriptionByGithubId(githubId: number): Promise<Subscription | null> {
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM subscriptions WHERE github_id = ${githubId} LIMIT 1`
    return (rows[0] as Subscription) || null
  } catch (error) {
    console.error('[v0] Error fetching subscription:', error)
    return null
  }
}

export async function getSubscriptionByStripeCustomerId(customerId: string): Promise<Subscription | null> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM subscriptions WHERE stripe_customer_id = ${customerId} LIMIT 1`
  return (rows[0] as Subscription) || null
}

export async function getUserByGithubId(githubId: number): Promise<{ id: string; github_id: number } | null> {
  const sql = getDb()
  const rows = await sql`SELECT id, github_id FROM user_auth WHERE github_id = ${githubId} LIMIT 1`
  return (rows[0] as { id: string; github_id: number }) || null
}

export async function upsertSubscription(data: {
  github_id: number
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  plan?: 'free' | 'byok' | 'pro' | 'scale'
  status?: 'active' | 'past_due' | 'canceled' | 'trialing'
  current_period_end?: string | null
}): Promise<Subscription> {
  try {
    const sql = getDb()
    const result = await sql`
      INSERT INTO subscriptions (github_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
      VALUES (
        ${data.github_id},
        ${data.stripe_customer_id ?? null},
        ${data.stripe_subscription_id ?? null},
        ${data.plan ?? 'free'},
        ${data.status ?? 'active'},
        ${data.current_period_end ?? null}
      )
      ON CONFLICT (github_id) DO UPDATE SET
        stripe_customer_id = COALESCE(${data.stripe_customer_id ?? null}, subscriptions.stripe_customer_id),
        stripe_subscription_id = COALESCE(${data.stripe_subscription_id ?? null}, subscriptions.stripe_subscription_id),
        plan = COALESCE(${data.plan ?? null}, subscriptions.plan),
        status = COALESCE(${data.status ?? null}, subscriptions.status),
        current_period_end = COALESCE(${data.current_period_end ?? null}, subscriptions.current_period_end),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    return result[0] as Subscription
  } catch (error) {
    console.error('[v0] Error upserting subscription:', error)
    // Return a default subscription object if the operation fails
    return {
      id: '',
      github_id: data.github_id,
      stripe_customer_id: data.stripe_customer_id ?? null,
      stripe_subscription_id: data.stripe_subscription_id ?? null,
      plan: data.plan ?? 'free',
      status: data.status ?? 'active',
      current_period_end: data.current_period_end ?? null,
      analyses_used_this_month: 0,
      billing_cycle_anchor: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Subscription
  }
}

export async function incrementAnalysisUsage(githubId: number): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE subscriptions
    SET analyses_used_this_month = analyses_used_this_month + 1, updated_at = CURRENT_TIMESTAMP
    WHERE github_id = ${githubId}
  `
}

export async function resetMonthlyUsage(githubId: number): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE subscriptions
    SET analyses_used_this_month = 0, billing_cycle_anchor = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE github_id = ${githubId}
  `
}

// Repository queries
export async function getAllRepositories(userId?: string): Promise<Repository[]> {
  const sql = getDb()
  const repos = userId
    ? await sql`SELECT * FROM repositories WHERE user_id = ${userId} ORDER BY created_at DESC`
    : await sql`SELECT * FROM repositories ORDER BY created_at DESC`
  return repos as Repository[]
}

export async function getRepositoryById(id: string, userId?: string): Promise<Repository | null> {
  const sql = getDb()
  const repos = userId
    ? await sql`SELECT * FROM repositories WHERE id = ${id} AND user_id = ${userId}`
    : await sql`SELECT * FROM repositories WHERE id = ${id}`
  return repos[0] as Repository || null
}

export async function createRepository(data: {
  user_id: string
  github_id: number
  name: string
  full_name: string
  description: string | null
  url: string
  default_branch: string
  language: string | null
  stars: number
}): Promise<Repository> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO repositories (user_id, github_id, name, full_name, description, url, default_branch, language, stars)
    VALUES (${data.user_id}, ${data.github_id}, ${data.name}, ${data.full_name}, ${data.description}, ${data.url}, ${data.default_branch}, ${data.language}, ${data.stars})
    ON CONFLICT (user_id, github_id) WHERE user_id IS NOT NULL DO UPDATE SET
      name = EXCLUDED.name,
      full_name = EXCLUDED.full_name,
      description = EXCLUDED.description,
      url = EXCLUDED.url,
      default_branch = EXCLUDED.default_branch,
      language = EXCLUDED.language,
      stars = EXCLUDED.stars,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  return result[0] as Repository
}

export async function deleteRepository(id: string, userId?: string): Promise<void> {
  const sql = getDb()
  if (userId) {
    await sql`DELETE FROM repositories WHERE id = ${id} AND user_id = ${userId}`
    return
  }
  await sql`DELETE FROM repositories WHERE id = ${id}`
}

// File queries
export async function getFilesByRepository(repoId: string): Promise<RepoFile[]> {
  const sql = getDb()
  const files = await sql`SELECT * FROM repo_files WHERE repository_id = ${repoId} ORDER BY path`
  return files as RepoFile[]
}

export async function createRepoFile(data: {
  repository_id: string
  path: string
  name: string
  extension: string | null
  size_bytes: number | null
  file_type: string | null
}): Promise<RepoFile> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO repo_files (repository_id, path, name, extension, size_bytes, file_type)
    VALUES (${data.repository_id}, ${data.path}, ${data.name}, ${data.extension}, ${data.size_bytes}, ${data.file_type})
    ON CONFLICT (repository_id, path) DO UPDATE SET
      name = EXCLUDED.name,
      extension = EXCLUDED.extension,
      size_bytes = EXCLUDED.size_bytes,
      file_type = EXCLUDED.file_type,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  return result[0] as RepoFile
}

export async function updateFileAnalysis(id: string, data: {
  purpose?: string
  technologies?: string[]
  exports?: string[]
  imports?: string[]
  reusability_score?: number
  ai_summary?: string
}): Promise<RepoFile> {
  const sql = getDb()
  const result = await sql`
    UPDATE repo_files SET
      purpose = COALESCE(${data.purpose ?? null}, purpose),
      technologies = COALESCE(${JSON.stringify(data.technologies || [])}::jsonb, technologies),
      exports = COALESCE(${JSON.stringify(data.exports || [])}::jsonb, exports),
      imports = COALESCE(${JSON.stringify(data.imports || [])}::jsonb, imports),
      reusability_score = COALESCE(${data.reusability_score ?? null}, reusability_score),
      ai_summary = COALESCE(${data.ai_summary ?? null}, ai_summary),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] as RepoFile
}

// Analysis queries
export async function getAllAnalyses(userId?: string): Promise<Analysis[]> {
  const sql = getDb()
  const analyses = userId
    ? await sql`SELECT * FROM analyses WHERE user_id = ${userId} ORDER BY created_at DESC`
    : await sql`SELECT * FROM analyses ORDER BY created_at DESC`
  return analyses as Analysis[]
}

export async function getAnalysisById(id: string, userId?: string): Promise<Analysis | null> {
  const sql = getDb()
  const analyses = userId
    ? await sql`SELECT * FROM analyses WHERE id = ${id} AND user_id = ${userId}`
    : await sql`SELECT * FROM analyses WHERE id = ${id}`
  return analyses[0] as Analysis || null
}

export async function createAnalysis(name: string, userId: string): Promise<Analysis> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO analyses (name, user_id, status)
    VALUES (${name}, ${userId}, 'pending')
    RETURNING *
  `
  return result[0] as Analysis
}

export async function updateAnalysisStatus(id: string, status: Analysis['status'], data?: {
  total_files?: number
  analyzed_files?: number
  error_message?: string
}): Promise<Analysis> {
  const sql = getDb()
  const result = await sql`
    UPDATE analyses SET
      status = ${status},
      total_files = COALESCE(${data?.total_files ?? null}, total_files),
      analyzed_files = COALESCE(${data?.analyzed_files ?? null}, analyzed_files),
      error_message = ${data?.error_message ?? null},
      started_at = CASE WHEN ${status} = 'scanning' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
      completed_at = CASE WHEN ${status} IN ('complete', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = ${id}
    RETURNING *
  `
  return result[0] as Analysis
}

export async function linkAnalysisToRepository(analysisId: string, repositoryId: string): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO analysis_repositories (analysis_id, repository_id)
    VALUES (${analysisId}, ${repositoryId})
    ON CONFLICT DO NOTHING
  `
}

export async function getRepositoriesForAnalysis(analysisId: string, userId?: string): Promise<Repository[]> {
  const sql = getDb()
  const repos = userId
    ? await sql`
      SELECT r.* FROM repositories r
      JOIN analysis_repositories ar ON r.id = ar.repository_id
      JOIN analyses a ON a.id = ar.analysis_id
      WHERE ar.analysis_id = ${analysisId} AND a.user_id = ${userId} AND r.user_id = ${userId}
    `
    : await sql`
      SELECT r.* FROM repositories r
      JOIN analysis_repositories ar ON r.id = ar.repository_id
      WHERE ar.analysis_id = ${analysisId}
    `
  return repos as Repository[]
}

// Blueprint queries
export async function getBlueprintsByAnalysis(analysisId: string, userId?: string): Promise<AppBlueprint[]> {
  const sql = getDb()
  const blueprints = userId
    ? await sql`
      SELECT b.* FROM app_blueprints b
      JOIN analyses a ON a.id = b.analysis_id
      WHERE b.analysis_id = ${analysisId} AND a.user_id = ${userId}
      ORDER BY b.reuse_percentage DESC
    `
    : await sql`SELECT * FROM app_blueprints WHERE analysis_id = ${analysisId} ORDER BY reuse_percentage DESC`
  return blueprints as AppBlueprint[]
}

export async function deleteBlueprintsByAnalysis(analysisId: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM app_blueprints WHERE analysis_id = ${analysisId}`
}

export async function updateUserBilling(userId: string, data: UserBillingUpdate): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE user_auth SET
      stripe_customer_id = COALESCE(${data.stripe_customer_id ?? null}, stripe_customer_id),
      stripe_subscription_id = ${data.stripe_subscription_id ?? null},
      stripe_price_id = ${data.stripe_price_id ?? null},
      plan_tier = COALESCE(${data.plan_tier ?? null}, plan_tier),
      subscription_status = ${data.subscription_status ?? null},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `
}

export async function createBlueprint(data: {
  analysis_id: string
  user_id: string
  name: string
  description: string | null
  app_type: string | null
  complexity: 'simple' | 'moderate' | 'complex'
  reuse_percentage: number
  existing_files: { path: string; purpose: string }[]
  missing_files: { name: string; purpose: string }[]
  estimated_effort: string | null
  technologies: string[]
  ai_explanation: string | null
}): Promise<AppBlueprint> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO app_blueprints (
      analysis_id, user_id, name, description, app_type, complexity, reuse_percentage,
      existing_files, missing_files, estimated_effort, technologies, ai_explanation
    )
    VALUES (
      ${data.analysis_id}, ${data.user_id}, ${data.name}, ${data.description}, ${data.app_type}, ${data.complexity},
      ${data.reuse_percentage}, ${JSON.stringify(data.existing_files)}::jsonb, ${JSON.stringify(data.missing_files)}::jsonb,
      ${data.estimated_effort}, ${JSON.stringify(data.technologies)}::jsonb, ${data.ai_explanation}
    )
    RETURNING *
  `
  return result[0] as AppBlueprint
}

export async function replaceBlueprintsForAnalysis(
  analysisId: string,
  userId: string,
  blueprints: Omit<BlueprintInsert, 'analysis_id' | 'user_id'>[],
): Promise<AppBlueprint[]> {
  if (blueprints.length === 0) return []

  const sql = getDb()
  const rows = blueprints.map((blueprint) => ({
    name: blueprint.name,
    description: blueprint.description,
    app_type: blueprint.app_type,
    complexity: blueprint.complexity,
    reuse_percentage: blueprint.reuse_percentage,
    existing_files: blueprint.existing_files,
    missing_files: blueprint.missing_files,
    estimated_effort: blueprint.estimated_effort,
    technologies: blueprint.technologies,
    ai_explanation: blueprint.ai_explanation,
  }))

  const result = await sql`
    WITH incoming AS (
      SELECT *
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(
        name text,
        description text,
        app_type text,
        complexity text,
        reuse_percentage numeric,
        existing_files jsonb,
        missing_files jsonb,
        estimated_effort text,
        technologies jsonb,
        ai_explanation text
      )
    ),
    deleted AS (
      DELETE FROM app_blueprints
      WHERE analysis_id = ${analysisId} AND user_id = ${userId}
    )
    INSERT INTO app_blueprints (
      analysis_id, user_id, name, description, app_type, complexity, reuse_percentage,
      existing_files, missing_files, estimated_effort, technologies, ai_explanation
    )
    SELECT
      ${analysisId},
      ${userId},
      name,
      description,
      app_type,
      complexity,
      reuse_percentage,
      COALESCE(existing_files, '[]'::jsonb),
      COALESCE(missing_files, '[]'::jsonb),
      estimated_effort,
      COALESCE(technologies, '[]'::jsonb),
      ai_explanation
    FROM incoming
    RETURNING *
  `

  return result as AppBlueprint[]
}

// Gap & Template types
export interface MissingFileGap {
  id: string
  blueprint_id: string
  file_name: string
  file_path: string
  purpose: string
  complexity: 'low' | 'medium' | 'high'
  estimated_hours: number
  category: 'auth' | 'api' | 'ui' | 'database' | 'utils' | 'config' | 'other'
  dependencies: string[] // file names this depends on
  is_blocking: boolean
  suggested_stub: string | null
  created_at: string
  updated_at: string
  blueprint_name?: string // name of the app/project these missing files belong to
  analysis_name?: string
}

export interface CompletedGap {
  id: string
  gap_id: string
  blueprint_id: string
  user_id: string | null
  completed_at: string
  created_at: string
}

export interface Template {
  id: string
  user_id: string | null
  name: string
  description: string | null
  blueprint_ids: string[] // which blueprints this template combines
  tech_stack: string[]
  estimated_hours: number
  reuse_percentage: number
  total_files: number
  missing_files: number
  tier: 'quick_start' | 'standard' | 'comprehensive'
  featured: boolean
  created_at: string
  updated_at: string
}

export interface GapSummary {
  total_gaps: number
  by_category: Record<string, number>
  total_hours: number
  blocking_gaps: number
  completed_count: number
}

// Gap queries
export async function getMissingGapsByBlueprint(blueprintId: string, userId?: string): Promise<MissingFileGap[]> {
  const sql = getDb()
  const gaps = userId
    ? await sql`
      SELECT g.* FROM missing_file_gaps g
      JOIN app_blueprints b ON b.id = g.blueprint_id
      JOIN analyses a ON a.id = b.analysis_id
      WHERE g.blueprint_id = ${blueprintId} AND a.user_id = ${userId}
      ORDER BY g.is_blocking DESC, g.complexity DESC
    `
    : await sql`
      SELECT * FROM missing_file_gaps 
      WHERE blueprint_id = ${blueprintId}
      ORDER BY is_blocking DESC, complexity DESC
    `
  return gaps as MissingFileGap[]
}

export async function getAllMissingGaps(userId?: string): Promise<MissingFileGap[]> {
  const sql = getDb()
  const gaps = userId
    ? await sql`
              SELECT g.*, b.name AS blueprint_name, a.name AS analysis_name FROM missing_file_gaps g
      JOIN app_blueprints b ON b.id = g.blueprint_id
      JOIN analyses a ON a.id = b.analysis_id
      WHERE a.user_id = ${userId}
      ORDER BY g.is_blocking DESC, g.complexity DESC, g.created_at DESC
    `
    : await sql`
      SELECT * FROM missing_file_gaps 
      ORDER BY is_blocking DESC, complexity DESC, created_at DESC
    `
  return gaps as MissingFileGap[]
}

export async function createMissingGap(data: {
  blueprint_id: string
  file_name: string
  file_path: string
  purpose: string
  complexity: 'low' | 'medium' | 'high'
  estimated_hours: number
  category: 'auth' | 'api' | 'ui' | 'database' | 'utils' | 'config' | 'other'
  dependencies?: string[]
  is_blocking?: boolean
  suggested_stub?: string | null
}): Promise<MissingFileGap> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO missing_file_gaps (
      blueprint_id, file_name, file_path, purpose, complexity, estimated_hours,
      category, dependencies, is_blocking, suggested_stub
    )
    VALUES (
      ${data.blueprint_id}, ${data.file_name}, ${data.file_path}, ${data.purpose},
      ${data.complexity}, ${data.estimated_hours}, ${data.category},
      ${JSON.stringify(data.dependencies || [])}::jsonb, ${data.is_blocking ?? false}, ${data.suggested_stub ?? null}
    )
    ON CONFLICT (blueprint_id, file_path) DO UPDATE SET
      purpose = EXCLUDED.purpose,
      complexity = EXCLUDED.complexity,
      estimated_hours = EXCLUDED.estimated_hours,
      category = EXCLUDED.category,
      dependencies = EXCLUDED.dependencies,
      is_blocking = EXCLUDED.is_blocking,
      suggested_stub = EXCLUDED.suggested_stub,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  return result[0] as MissingFileGap
}

export async function markGapAsComplete(gapId: string, blueprintId: string, userId: string): Promise<CompletedGap> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO completed_gaps (gap_id, blueprint_id, user_id)
    VALUES (${gapId}, ${blueprintId}, ${userId})
    ON CONFLICT DO NOTHING
    RETURNING *
  `
  return result[0] as CompletedGap
}

export async function getCompletedGapIdsForUser(userId: string): Promise<string[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT c.gap_id
    FROM completed_gaps c
    JOIN app_blueprints b ON b.id = c.blueprint_id
    JOIN analyses a ON a.id = b.analysis_id
    WHERE a.user_id = ${userId}
  `
  return (rows as Array<{ gap_id: string }>).map((row) => row.gap_id)
}

export async function getCompletedGapCount(blueprintId: string): Promise<number> {
  const sql = getDb()
  const result = await sql`
    SELECT COUNT(*) as count FROM completed_gaps WHERE blueprint_id = ${blueprintId}
  `
  return result[0].count as number
}

export async function getGapSummary(userId?: string): Promise<GapSummary> {
  const sql = getDb()
  const gaps = userId
    ? await sql`
      SELECT 
        COUNT(*) as total_gaps,
        COUNT(CASE WHEN g.is_blocking THEN 1 END) as blocking_gaps,
        COALESCE(SUM(g.estimated_hours), 0) as total_hours
      FROM missing_file_gaps g
      JOIN app_blueprints b ON b.id = g.blueprint_id
      JOIN analyses a ON a.id = b.analysis_id
      WHERE a.user_id = ${userId}
    `
    : await sql`
      SELECT 
        COUNT(*) as total_gaps,
        COUNT(CASE WHEN is_blocking THEN 1 END) as blocking_gaps,
        COALESCE(SUM(estimated_hours), 0) as total_hours
      FROM missing_file_gaps
    `
  const categories = userId
    ? await sql`
      SELECT g.category, COUNT(*) as count
      FROM missing_file_gaps g
      JOIN app_blueprints b ON b.id = g.blueprint_id
      JOIN analyses a ON a.id = b.analysis_id
      WHERE a.user_id = ${userId}
      GROUP BY g.category
    `
    : await sql`
      SELECT category, COUNT(*) as count
      FROM missing_file_gaps
      GROUP BY category
    `
  const completed = userId
    ? await sql`
      SELECT COUNT(*) as count
      FROM completed_gaps c
      JOIN app_blueprints b ON b.id = c.blueprint_id
      JOIN analyses a ON a.id = b.analysis_id
      WHERE a.user_id = ${userId}
    `
    : await sql`SELECT COUNT(*) as count FROM completed_gaps`
  
  return {
    total_gaps: gaps[0]?.total_gaps || 0,
    blocking_gaps: gaps[0]?.blocking_gaps || 0,
    total_hours: gaps[0]?.total_hours || 0,
    by_category: Object.fromEntries((categories as Array<{ category: string; count: number }>).map((row) => [row.category, Number(row.count)])),
    completed_count: completed[0]?.count || 0,
  }
}

// Template queries
export async function createTemplate(data: {
  user_id?: string | null
  name: string
  description: string | null
  blueprint_ids: string[]
  tech_stack: string[]
  estimated_hours: number
  reuse_percentage: number
  total_files: number
  missing_files: number
  tier: 'quick_start' | 'standard' | 'comprehensive'
  featured?: boolean
}): Promise<Template> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO templates (
      user_id, name, description, blueprint_ids, tech_stack, estimated_hours, reuse_percentage,
      total_files, missing_files, tier, featured
    )
    VALUES (
      ${data.user_id ?? null}, ${data.name}, ${data.description}, ${JSON.stringify(data.blueprint_ids)}::jsonb,
      ${JSON.stringify(data.tech_stack)}::jsonb, ${data.estimated_hours}, ${data.reuse_percentage},
      ${data.total_files}, ${data.missing_files}, ${data.tier}, ${data.featured ?? false}
    )
    RETURNING *
  `
  return result[0] as Template
}

export async function getFeaturedTemplates(userId?: string): Promise<Template[]> {
  const sql = getDb()
  const templates = userId
    ? await sql`
      SELECT * FROM templates 
      WHERE featured = true AND user_id = ${userId}
      ORDER BY tier, estimated_hours ASC
    `
    : await sql`
      SELECT * FROM templates 
      WHERE featured = true
      ORDER BY tier, estimated_hours ASC
    `
  return templates as Template[]
}

export async function getAllTemplates(userId?: string): Promise<Template[]> {
  const sql = getDb()
  const templates = userId
    ? await sql`
      SELECT * FROM templates 
      WHERE user_id = ${userId}
      ORDER BY tier, estimated_hours ASC
    `
    : await sql`
      SELECT * FROM templates 
      ORDER BY tier, estimated_hours ASC
    `
  return templates as Template[]
}

// API Key management queries
export interface UserAPIKey {
  id: string
  user_id: string
  provider: 'anthropic' | 'openai' | 'grok' | 'deepinfra'
  enabled: boolean
  created_at: string
  last_used_at: string | null
}

export async function getUserAPIKeys(userId: string): Promise<UserAPIKey[]> {
  const sql = getDb()
  const keys = await sql`
    SELECT id, user_id, provider, enabled, created_at, last_used_at 
    FROM user_api_keys 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return keys as UserAPIKey[]
}

export async function getUserAPIKey(userId: string, provider: string): Promise<UserAPIKey | null> {
  const sql = getDb()
  const keys = await sql`
    SELECT id, user_id, provider, enabled, created_at, last_used_at 
    FROM user_api_keys 
    WHERE user_id = ${userId} AND provider = ${provider}
    LIMIT 1
  `
  return (keys[0] as UserAPIKey) || null
}

export async function storeEncryptedAPIKey(
  userId: string,
  provider: string,
  encryptedKey: string
): Promise<UserAPIKey> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO user_api_keys (user_id, provider, encrypted_key, enabled)
    VALUES (${userId}, ${provider}, ${encryptedKey}, true)
    ON CONFLICT (user_id, provider) DO UPDATE
    SET encrypted_key = EXCLUDED.encrypted_key, enabled = true, created_at = CURRENT_TIMESTAMP
    RETURNING id, user_id, provider, enabled, created_at, last_used_at
  `
  return result[0] as UserAPIKey
}

export async function deleteAPIKey(userId: string, provider: string): Promise<boolean> {
  const sql = getDb()
  const result = await sql`
    DELETE FROM user_api_keys 
    WHERE user_id = ${userId} AND provider = ${provider}
    RETURNING id
  `
  return result.length > 0
}

export async function updateAPIKeyLastUsed(userId: string, provider: string): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE user_api_keys 
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId} AND provider = ${provider}
  `
}

export async function updatePreferredProvider(userId: string, provider: string): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE users 
    SET preferred_ai_provider = ${provider}
    WHERE id = ${userId}
  `
}

// Blueprint view tracking for usage limits
export interface BlueprintView {
  id: string
  user_id: string
  blueprint_id: string
  first_viewed_at: string
  view_count: number
  last_viewed_at: string
}

export async function trackBlueprintView(userId: string, blueprintId: string): Promise<void> {
  try {
    const sql = getDb()
    await sql`
      INSERT INTO blueprint_views (user_id, blueprint_id, first_viewed_at, view_count, last_viewed_at)
      VALUES (${userId}, ${blueprintId}, NOW(), 1, NOW())
      ON CONFLICT (user_id, blueprint_id) 
      DO UPDATE SET 
        view_count = blueprint_views.view_count + 1,
        last_viewed_at = NOW()
    `
  } catch {
    // Table may not exist yet - silently ignore
  }
}

export async function countUserBlueprintViews(userId: string): Promise<number> {
  try {
    const sql = getDb()
    const result = await sql`
      SELECT COUNT(*) as count FROM blueprint_views WHERE user_id = ${userId}
    `
    return Number(result[0]?.count || 0)
  } catch {
    // Table may not exist yet - return 0
    return 0
  }
}

export async function getUserViewedBlueprintIds(userId: string): Promise<string[]> {
  try {
    const sql = getDb()
    const result = await sql`
      SELECT blueprint_id FROM blueprint_views WHERE user_id = ${userId}
    `
    return (result as Array<{ blueprint_id: string }> || []).map((r) => r.blueprint_id)
  } catch {
    // Table may not exist yet - return empty array
    return []
  }
}

export async function canViewBlueprint(userId: string, blueprintId: string, limit: number): Promise<boolean> {
  try {
    const sql = getDb()
    // Check if already viewed
    const alreadyViewed = await sql`
      SELECT 1 FROM blueprint_views WHERE user_id = ${userId} AND blueprint_id = ${blueprintId}
    `
    if (alreadyViewed.length > 0) return true
    
    // Check if under limit
    const viewCount = await countUserBlueprintViews(userId)
    return viewCount < limit
  } catch {
    // Table may not exist yet - allow view
    return true
  }
}

export async function getAllBlueprints(userId?: string): Promise<AppBlueprint[]> {
  const sql = getDb()
  const blueprints = userId
    ? await sql`
        SELECT b.* FROM app_blueprints b
        JOIN analyses a ON a.id = b.analysis_id
        WHERE a.user_id = ${userId}
        ORDER BY b.reuse_percentage DESC, b.created_at DESC
      `
    : await sql`SELECT * FROM app_blueprints ORDER BY reuse_percentage DESC, created_at DESC`
  return blueprints as AppBlueprint[]
}

// ── Project types ─────────────────────────────────────────────────────────────

export interface Project {
  id: string
  user_id: string | null
  blueprint_id: string | null
  name: string
  description: string | null
  repo_url: string | null
  deployment_url: string | null
  status: 'planning' | 'building' | 'deployed' | 'paused' | 'archived'
  tech_stack: string[]
  frontend_status: 'not_started' | 'in_progress' | 'complete'
  backend_status: 'not_started' | 'in_progress' | 'complete'
  notes: string | null
  created_at: string
  updated_at: string
  // computed after joining milestones
  milestone_total?: number
  milestone_done?: number
}

export interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  phase: 'planning' | 'backend' | 'frontend' | 'integration' | 'deployment' | 'other'
  completed: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
}

// ── Project queries ───────────────────────────────────────────────────────────

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT
      p.*,
      COUNT(m.id)::int                                    AS milestone_total,
      COUNT(m.id) FILTER (WHERE m.completed)::int         AS milestone_done
    FROM projects p
    LEFT JOIN project_milestones m ON m.project_id = p.id
    WHERE p.user_id = ${userId}
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `
  return rows as Project[]
}

export async function getProjectById(id: string, userId?: string): Promise<Project | null> {
  const sql = getDb()
  const rows = userId
    ? await sql`
        SELECT
          p.*,
          COUNT(m.id)::int                                    AS milestone_total,
          COUNT(m.id) FILTER (WHERE m.completed)::int         AS milestone_done
        FROM projects p
        LEFT JOIN project_milestones m ON m.project_id = p.id
        WHERE p.id = ${id} AND p.user_id = ${userId}
        GROUP BY p.id
      `
    : await sql`
        SELECT p.*, 0 AS milestone_total, 0 AS milestone_done
        FROM projects p WHERE p.id = ${id}
      `
  return (rows[0] as Project) || null
}

export async function createProject(data: {
  user_id: string
  blueprint_id?: string | null
  name: string
  description?: string | null
  repo_url?: string | null
  deployment_url?: string | null
  status?: Project['status']
  tech_stack?: string[]
  frontend_status?: Project['frontend_status']
  backend_status?: Project['backend_status']
  notes?: string | null
}): Promise<Project> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO projects (
      user_id, blueprint_id, name, description, repo_url, deployment_url,
      status, tech_stack, frontend_status, backend_status, notes
    ) VALUES (
      ${data.user_id},
      ${data.blueprint_id ?? null},
      ${data.name},
      ${data.description ?? null},
      ${data.repo_url ?? null},
      ${data.deployment_url ?? null},
      ${data.status ?? 'planning'},
      ${JSON.stringify(data.tech_stack ?? [])}::jsonb,
      ${data.frontend_status ?? 'not_started'},
      ${data.backend_status ?? 'not_started'},
      ${data.notes ?? null}
    )
    RETURNING *
  `
  return { ...result[0], milestone_total: 0, milestone_done: 0 } as Project
}

export async function updateProject(
  id: string,
  userId: string,
  data: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestone_total' | 'milestone_done'>>,
): Promise<Project | null> {
  const sql = getDb()
  const result = await sql`
    UPDATE projects SET
      name              = COALESCE(${data.name ?? null}, name),
      description       = COALESCE(${data.description ?? null}, description),
      repo_url          = COALESCE(${data.repo_url ?? null}, repo_url),
      deployment_url    = COALESCE(${data.deployment_url ?? null}, deployment_url),
      status            = COALESCE(${data.status ?? null}, status),
      tech_stack        = COALESCE(${data.tech_stack ? JSON.stringify(data.tech_stack) + '::jsonb' : null}, tech_stack),
      frontend_status   = COALESCE(${data.frontend_status ?? null}, frontend_status),
      backend_status    = COALESCE(${data.backend_status ?? null}, backend_status),
      notes             = COALESCE(${data.notes ?? null}, notes),
      updated_at        = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return (result[0] as Project) || null
}

export async function updateProjectRaw(
  id: string,
  userId: string,
  fields: Record<string, string | string[] | null>,
): Promise<Project | null> {
  const sql = getDb()
  const allowed = ['name','description','repo_url','deployment_url','status','frontend_status','backend_status','notes']
  const techStack = fields.tech_stack as string[] | undefined

  const result = await sql`
    UPDATE projects SET
      name            = CASE WHEN ${fields.name !== undefined} THEN ${fields.name as string | null} ELSE name END,
      description     = CASE WHEN ${fields.description !== undefined} THEN ${fields.description as string | null} ELSE description END,
      repo_url        = CASE WHEN ${fields.repo_url !== undefined} THEN ${fields.repo_url as string | null} ELSE repo_url END,
      deployment_url  = CASE WHEN ${fields.deployment_url !== undefined} THEN ${fields.deployment_url as string | null} ELSE deployment_url END,
      status          = CASE WHEN ${fields.status !== undefined} THEN ${fields.status as string | null} ELSE status END,
      frontend_status = CASE WHEN ${fields.frontend_status !== undefined} THEN ${fields.frontend_status as string | null} ELSE frontend_status END,
      backend_status  = CASE WHEN ${fields.backend_status !== undefined} THEN ${fields.backend_status as string | null} ELSE backend_status END,
      tech_stack      = CASE WHEN ${techStack !== undefined} THEN ${JSON.stringify(techStack ?? [])}::jsonb ELSE tech_stack END,
      notes           = CASE WHEN ${fields.notes !== undefined} THEN ${fields.notes as string | null} ELSE notes END,
      updated_at      = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return (result[0] as Project) || null
}

export async function deleteProject(id: string, userId: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM projects WHERE id = ${id} AND user_id = ${userId}`
}

// ── Milestone queries ─────────────────────────────────────────────────────────

export async function getMilestonesByProject(projectId: string): Promise<ProjectMilestone[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM project_milestones
    WHERE project_id = ${projectId}
    ORDER BY phase, sort_order, created_at
  `
  return rows as ProjectMilestone[]
}

export async function createMilestone(data: {
  project_id: string
  title: string
  phase: ProjectMilestone['phase']
  sort_order?: number
}): Promise<ProjectMilestone> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO project_milestones (project_id, title, phase, sort_order)
    VALUES (${data.project_id}, ${data.title}, ${data.phase}, ${data.sort_order ?? 0})
    RETURNING *
  `
  return result[0] as ProjectMilestone
}

export async function toggleMilestone(
  projectId: string,
  milestoneId: string,
  userId: string,
  completed: boolean,
): Promise<ProjectMilestone | null> {
  const sql = getDb()
  const result = completed
    ? await sql`
        UPDATE project_milestones
        SET completed = true, completed_at = NOW()
        WHERE id = ${milestoneId}
          AND project_id = ${projectId}
          AND EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_milestones.project_id
              AND projects.user_id = ${userId}
          )
        RETURNING *
      `
    : await sql`
        UPDATE project_milestones
        SET completed = false, completed_at = NULL
        WHERE id = ${milestoneId}
          AND project_id = ${projectId}
          AND EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_milestones.project_id
              AND projects.user_id = ${userId}
          )
        RETURNING *
      `
  return (result[0] as ProjectMilestone) || null
}

export async function deleteMilestone(projectId: string, milestoneId: string, userId: string): Promise<boolean> {
  const sql = getDb()
  const result = await sql`
    DELETE FROM project_milestones
    WHERE id = ${milestoneId}
      AND project_id = ${projectId}
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_milestones.project_id
          AND projects.user_id = ${userId}
      )
    RETURNING id
  `
  return result.length > 0
}

export async function seedDefaultMilestones(projectId: string): Promise<void> {
  const defaults: Array<{ title: string; phase: ProjectMilestone['phase']; sort_order: number }> = [
    { title: 'Define app requirements', phase: 'planning', sort_order: 0 },
    { title: 'Design data model', phase: 'planning', sort_order: 1 },
    { title: 'Choose tech stack', phase: 'planning', sort_order: 2 },
    { title: 'Set up database & schema', phase: 'backend', sort_order: 0 },
    { title: 'Build API endpoints', phase: 'backend', sort_order: 1 },
    { title: 'Implement authentication', phase: 'backend', sort_order: 2 },
    { title: 'Write API tests', phase: 'backend', sort_order: 3 },
    { title: 'Initialize UI project', phase: 'frontend', sort_order: 0 },
    { title: 'Build core components', phase: 'frontend', sort_order: 1 },
    { title: 'Implement pages & routing', phase: 'frontend', sort_order: 2 },
    { title: 'Connect frontend to API', phase: 'frontend', sort_order: 3 },
    { title: 'Responsive design & polish', phase: 'frontend', sort_order: 4 },
    { title: 'End-to-end testing', phase: 'integration', sort_order: 0 },
    { title: 'Bug fixes & code review', phase: 'integration', sort_order: 1 },
    { title: 'Configure hosting provider', phase: 'deployment', sort_order: 0 },
    { title: 'Set environment variables', phase: 'deployment', sort_order: 1 },
    { title: 'Deploy to production', phase: 'deployment', sort_order: 2 },
    { title: 'Set up custom domain', phase: 'deployment', sort_order: 3 },
    { title: 'Set up monitoring & alerts', phase: 'deployment', sort_order: 4 },
  ]
  const sql = getDb()
  for (const m of defaults) {
    await sql`
      INSERT INTO project_milestones (project_id, title, phase, sort_order)
      VALUES (${projectId}, ${m.title}, ${m.phase}, ${m.sort_order})
    `
  }
}
