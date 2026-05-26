import { createMissingGap, createTemplate, type AppBlueprint } from '@/lib/queries'

// Type definitions
type MissingFile = { name: string; purpose: string }

/**
 * Generate missing file gaps from a blueprint's missing_files array
 * Called after blueprint creation during analysis
 */
export async function generateGapsFromBlueprint(blueprint: AppBlueprint) {
  try {
    const { missing_files } = blueprint

    if (!missing_files || missing_files.length === 0) {
      return []
    }

    const gaps = []

    for (const file of missing_files) {
      // Infer complexity from file purpose
      const complexity = inferComplexity(file.purpose || '')
      const category = inferCategory(file.name, file.purpose)
      const estimatedHours = estimateEffort(complexity)
      const dependencies = inferDependencies(file.name, missing_files)

      const gap = await createMissingGap({
        blueprint_id: blueprint.id,
        file_name: file.name,
        file_path: file.name, // In real scenario, parse from blueprint data
        purpose: file.purpose || `Missing file: ${file.name}`,
        complexity,
        estimated_hours: estimatedHours,
        category,
        dependencies,
        is_blocking: dependencies.length > 0,
      })

      gaps.push(gap)
    }

    return gaps
  } catch (error) {
    console.error('[v0] Error generating gaps:', error)
    return []
  }
}

/**
 * Generate template suggestions from related blueprints
 */
export async function generateTemplatesFromBlueprints(blueprints: AppBlueprint[]) {
  try {
    if (blueprints.length < 2) {
      return []
    }

    const templates = []

    // Create 1-2 smart templates based on blueprint combinations
    const shipReady = blueprints.filter(b => b.reuse_percentage >= 75)
    const complementary = blueprints.slice(0, 3)

    if (shipReady.length >= 2) {
      const template = await createTemplate({
        user_id: shipReady[0]?.user_id ?? null,
        name: 'Ship-Ready Combination',
        description: `Combine your ${shipReady.length} ship-ready projects for maximum impact`,
        blueprint_ids: shipReady.map(b => b.id),
        tech_stack: extractTechStack(shipReady),
        estimated_hours: sumEstimatedHours(shipReady),
        reuse_percentage: avgReuse(shipReady),
        total_files: sumTotalFiles(shipReady),
        missing_files: sumMissingFiles(shipReady),
        tier: 'quick_start',
        featured: true,
      })
      templates.push(template)
    }

    if (complementary.length >= 2) {
      const template = await createTemplate({
        user_id: complementary[0]?.user_id ?? null,
        name: 'Full-Stack Combination',
        description: `Assemble these complementary projects into one product`,
        blueprint_ids: complementary.map(b => b.id),
        tech_stack: extractTechStack(complementary),
        estimated_hours: sumEstimatedHours(complementary),
        reuse_percentage: avgReuse(complementary),
        total_files: sumTotalFiles(complementary),
        missing_files: sumMissingFiles(complementary),
        tier: 'standard',
        featured: false,
      })
      templates.push(template)
    }

    return templates
  } catch (error) {
    console.error('[v0] Error generating templates:', error)
    return []
  }
}

// Complexity inference
function inferComplexity(purpose: string): 'low' | 'medium' | 'high' {
  const lower = purpose.toLowerCase()

  const highComplexity = ['auth', 'security', 'payment', 'webhook', 'cache', 'queue', 'streaming']
  const mediumComplexity = ['api', 'service', 'handler', 'middleware', 'validator', 'parser']

  if (highComplexity.some(word => lower.includes(word))) return 'high'
  if (mediumComplexity.some(word => lower.includes(word))) return 'medium'
  return 'low'
}

// Category inference
function inferCategory(
  fileName: string,
  purpose?: string
): 'auth' | 'api' | 'ui' | 'database' | 'utils' | 'config' | 'other' {
  const combined = `${fileName} ${purpose || ''}`.toLowerCase()

  if (
    combined.includes('auth') ||
    combined.includes('login') ||
    combined.includes('session') ||
    combined.includes('jwt')
  ) {
    return 'auth'
  }
  if (
    combined.includes('api') ||
    combined.includes('route') ||
    combined.includes('endpoint') ||
    combined.includes('handler')
  ) {
    return 'api'
  }
  if (
    combined.includes('component') ||
    combined.includes('ui') ||
    combined.includes('page') ||
    combined.includes('layout')
  ) {
    return 'ui'
  }
  if (
    combined.includes('database') ||
    combined.includes('db') ||
    combined.includes('schema') ||
    combined.includes('migration') ||
    combined.includes('query')
  ) {
    return 'database'
  }
  if (
    combined.includes('utils') ||
    combined.includes('helper') ||
    combined.includes('constant') ||
    combined.includes('type')
  ) {
    return 'utils'
  }
  if (combined.includes('config') || combined.includes('env') || combined.includes('settings')) {
    return 'config'
  }

  return 'other'
}

// Effort estimation
function estimateEffort(complexity: 'low' | 'medium' | 'high'): number {
  switch (complexity) {
    case 'low':
      return Math.random() * (1.5 - 0.5) + 0.5 // 0.5-1.5 hours
    case 'medium':
      return Math.random() * (4 - 2) + 2 // 2-4 hours
    case 'high':
      return Math.random() * (8 - 4) + 4 // 4-8 hours
  }
}

// Dependency inference
function inferDependencies(fileName: string, allFiles: MissingFile[]): string[] {
  const lower = fileName.toLowerCase()
  const deps: string[] = []

  // Common dependency patterns
  if (lower.includes('page') || lower.includes('component')) {
    // UI files usually depend on utils, types
    const typeFile = allFiles.find(f => f.name.includes('types'))
    if (typeFile) deps.push(typeFile.name)
  }

  if (lower.includes('api') || lower.includes('route')) {
    // API files usually depend on auth, database
    const authFile = allFiles.find(f => f.name.includes('auth'))
    const dbFile = allFiles.find(f => f.name.includes('database'))
    if (authFile) deps.push(authFile.name)
    if (dbFile) deps.push(dbFile.name)
  }

  if (lower.includes('middleware')) {
    // Middleware depends on auth and types
    const authFile = allFiles.find(f => f.name.includes('auth'))
    if (authFile) deps.push(authFile.name)
  }

  return deps
}

// Template aggregation helpers
function extractTechStack(blueprints: AppBlueprint[]): string[] {
  const stack = new Set<string>()
  blueprints.forEach(b => {
    b.technologies.forEach(t => stack.add(t))
  })
  return Array.from(stack).slice(0, 5)
}

function sumEstimatedHours(blueprints: AppBlueprint[]): number {
  return blueprints.reduce((sum, b) => {
    const hours = b.estimated_effort ? parseInt(b.estimated_effort.split(' ')[0]) : 4
    return sum + hours
  }, 0)
}

function avgReuse(blueprints: AppBlueprint[]): number {
  const sum = blueprints.reduce((acc, b) => acc + b.reuse_percentage, 0)
  return Math.round(sum / blueprints.length)
}

function sumTotalFiles(blueprints: AppBlueprint[]): number {
  return blueprints.reduce((sum, b) => {
    const existing = b.existing_files?.length || 0
    const missing = b.missing_files?.length || 0
    return sum + existing + missing
  }, 0)
}

function sumMissingFiles(blueprints: AppBlueprint[]): number {
  return blueprints.reduce((sum, b) => sum + (b.missing_files?.length || 0), 0)
}
