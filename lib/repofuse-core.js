import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_REPOFUSE_MODEL = process.env.REPOFUSE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-opus-4-6'

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'go', 'rs', 'java', 'rb', 'php', 'vue', 'svelte', 'swift', 'kt', 'kts',
  'scala', 'cs', 'cpp', 'c', 'h', 'hpp', 'sql', 'html', 'css', 'scss', 'mdx', 'json', 'yaml', 'yml',
])

export function createAnthropicPromptRunner({ apiKey, model = DEFAULT_REPOFUSE_MODEL }) {
  const client = new Anthropic({ apiKey })

  return async function runPrompt(prompt, { maxTokens = 4000 } = {}) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    return getAnthropicText(response)
  }
}

export async function listGitHubRepositories(accessToken, options = {}) {
  const { limit = 50, visibility = 'all', sort = 'updated' } = options
  const repositories = []

  for (let page = 1; repositories.length < limit && page <= 5; page += 1) {
    const pageItems = await githubRequest(
      `https://api.github.com/user/repos?per_page=100&sort=${sort}&affiliation=owner,collaborator,organization_member&page=${page}`,
      accessToken,
    )

    for (const repo of pageItems) {
      if (visibility !== 'all') {
        const repoVisibility = repo.private ? 'private' : 'public'
        if (repoVisibility !== visibility) continue
      }

      repositories.push({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        private: repo.private,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
      })

      if (repositories.length >= limit) break
    }

    if (pageItems.length < 100) break
  }

  return repositories.slice(0, limit)
}

export async function analyzeGitHubRepositories({
  accessToken,
  repositories,
  maxFilesPerRepo = 120,
  maxBlueprints = 5,
  runPrompt,
}) {
  const scannedRepositories = []
  const allFiles = []

  for (const fullName of repositories) {
    const repo = await getGitHubRepository(fullName, accessToken)
    const tree = await getGitHubRepositoryTree(fullName, repo.default_branch, accessToken)
    const files = selectInterestingFiles(tree.tree || [], maxFilesPerRepo).map((file) => ({
      repo: fullName,
      path: file.path,
      extension: file.extension,
      file_type: classifyFileType(file.path),
      size: file.size ?? null,
    }))

    scannedRepositories.push({
      full_name: fullName,
      default_branch: repo.default_branch,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      private: repo.private,
      scanned_file_count: files.length,
    })

    allFiles.push(...files)
  }

  if (allFiles.length === 0) {
    throw new Error('No code files were found in the selected repositories.')
  }

  return analyzeFileInventory({
    repositories: scannedRepositories,
    files: allFiles,
    maxBlueprints,
    runPrompt,
  })
}

export async function analyzeScannedFiles({ scannedFiles, maxBlueprints = 8, runPrompt }) {
  if (!Array.isArray(scannedFiles) || scannedFiles.length === 0) {
    throw new Error('No code files found to analyze.')
  }

  const repositories = summarizeScannedFiles(scannedFiles)
  const files = scannedFiles.map((file) => ({
    repo: file.repo || file.repository || file.platform || 'unknown-source',
    path: file.path,
    extension: file.language || pathExtension(file.path),
    file_type: file.file_type || classifyFileType(file.path),
    purpose: file.purpose || '',
    size: file.size ?? null,
  }))

  return analyzeFileInventory({
    repositories,
    files,
    maxBlueprints,
    runPrompt,
  })
}

export async function analyzeFileInventory({ repositories, files, maxBlueprints = 5, runPrompt }) {
  const prompt = buildBlueprintPrompt({ repositories, files, maxBlueprints })
  const responseText = await runPrompt(prompt, { maxTokens: 4000 })
  const payload = extractJson(responseText)

  return normalizeBlueprintResponse(payload, {
    repositories,
    files,
  })
}

/**
 * @param {{
 *   appName: string,
 *   description: string,
 *   technologies: string[],
 *   existingFiles?: string[],
 *   missingFiles?: Array<string | {name?: string, path?: string}>,
 *   runPrompt: (prompt: string, options?: { maxTokens?: number }) => Promise<string>
 * }} params
 */
export async function generateScaffold({
  appName,
  description,
  technologies,
  existingFiles,
  missingFiles,
  runPrompt,
}) {
  const reusableFiles = Array.isArray(existingFiles) ? existingFiles : []
  const unresolvedFiles = Array.isArray(missingFiles) ? missingFiles : []

  const prompt = `Generate a production-ready scaffold plan for this RepoFuse blueprint.\n\nApp name: ${appName}\nDescription: ${description}\nTechnologies: ${technologies.join(', ')}\nReusable files already available: ${reusableFiles.join(', ') || 'None listed'}\nMissing files to generate: ${normalizeMissingFileNames(unresolvedFiles).join(', ') || 'None listed'}\n\nReturn ONLY valid JSON with this exact shape:\n{\n  "structure": { "path": "purpose" },\n  "files": {\n    "README.md": "...",\n    "package.json": { "content": "..." },\n    ".env.example": "..."\n  },\n  "implementationPlan": ["step 1", "step 2"],\n  "notes": ["note 1"]\n}`

  const responseText = await runPrompt(prompt, { maxTokens: 4000 })
  return extractJson(responseText)
}

export async function createGitHubRepositoryFromBlueprint({
  accessToken,
  repoName,
  app,
  privateRepo = false,
}) {
  const createRepoRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      name: repoName.trim(),
      description: app.description,
      private: privateRepo,
      auto_init: true,
      gitignore_template: 'Node',
    }),
  })

  if (!createRepoRes.ok) {
    const error = await readGitHubError(createRepoRes)
    throw new Error(error)
  }

  const newRepo = await createRepoRes.json()
  const templateFiles = generateTemplateFiles(app)

  for (const [fileName, content] of Object.entries(templateFiles)) {
    await createFileInRepo({
      owner: newRepo.owner.login,
      repo: newRepo.name,
      path: fileName,
      content,
      accessToken,
    })
  }

  return {
    repository: {
      name: newRepo.name,
      full_name: newRepo.full_name,
      url: newRepo.html_url,
      clone_url: newRepo.clone_url,
      private: newRepo.private,
    },
    files_created: Object.keys(templateFiles),
  }
}

export function generateTemplateFiles(app) {
  const appName = app.app_name || app.appName || 'RepoFuse App'
  const appType = app.app_type || app.appType || 'web-app'
  const description = app.description || 'Generated by RepoFuse'
  const technologies = Array.isArray(app.technologies) ? app.technologies : []
  const difficultyLevel = app.difficulty_level || app.difficultyLevel || 'medium'
  const explanation = app.ai_explanation || app.aiExplanation || ''
  const missingFiles = normalizeMissingFileNames(app.missing_files || app.missingFiles || [])

  return {
    'README.md': `# ${appName}\n\n${description}\n\n## Technologies\n${technologies.map((tech) => `- ${tech}`).join('\n') || '- TBD'}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Difficulty Level\n${difficultyLevel}\n\n## Notes\n${explanation || 'Generated by RepoFuse.'}\n\n${missingFiles.length > 0 ? `## Missing Files to Add\n${missingFiles.map((file) => `- [ ] ${file}`).join('\n')}\n` : ''}`,
    'package.json': JSON.stringify(
      {
        name: toSlug(appName),
        version: '1.0.0',
        description,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          react: '^18.0.0',
          next: '^14.0.0',
        },
      },
      null,
      2,
    ),
    '.gitignore': `node_modules/\n.env\n.env.local\n.env.*.local\n.next/\ndist/\nbuild/\n*.log\n.DS_Store\n`,
    '.env.example': `# Environment variables for ${appName}\nNEXT_PUBLIC_APP_NAME=${toEnvValue(appName)}\nNEXT_PUBLIC_APP_TYPE=${toEnvValue(appType)}\n`,
  }
}

export function normalizeBlueprintResponse(payload, context) {
  const rawBlueprints = Array.isArray(payload) ? payload : payload?.blueprints

  if (!Array.isArray(rawBlueprints) || rawBlueprints.length === 0) {
    throw new Error('The model did not return any blueprints.')
  }

  return {
    repositories: context.repositories,
    scanned_files: context.files.length,
    blueprints: rawBlueprints.map((blueprint, index) => {
      const missingFiles = blueprint.missingFiles ?? blueprint.missing_files ?? []
      return {
        id: `blueprint-${index + 1}`,
        name: blueprint.name,
        description: blueprint.description,
        app_type: blueprint.appType || blueprint.app_type || blueprint.type || 'Application',
        complexity: normalizeComplexity(blueprint.complexity),
        reuse_percentage: clampPercentage(blueprint.reusePercentage ?? blueprint.reuse_percentage ?? 0),
        existing_files: normalizeExistingFiles(blueprint.existingFiles ?? blueprint.existing_files ?? []),
        missing_files: normalizeMissingFiles(missingFiles),
        technologies: Array.isArray(blueprint.technologies) ? blueprint.technologies : [],
        estimated_effort:
          blueprint.estimatedEffort ||
          blueprint.estimated_effort ||
          estimateEffort(blueprint.complexity, Array.isArray(missingFiles) ? missingFiles.length : 0),
        ai_explanation: blueprint.explanation || blueprint.ai_explanation || '',
      }
    }),
  }
}

export function estimateEffort(complexity, missingFiles) {
  if (complexity === 'simple' && missingFiles <= 2) return '1-2 hours'
  if (complexity === 'simple') return '2-4 hours'
  if (complexity === 'moderate' && missingFiles <= 5) return '1-2 days'
  if (complexity === 'moderate') return '2-3 days'
  if (complexity === 'complex' && missingFiles <= 10) return '3-5 days'
  return '1-2 weeks'
}

export function extractJson(value) {
  if (!value || typeof value !== 'string') {
    throw new Error('Model response was empty.')
  }

  const trimmed = value.trim()
  const direct = safeJsonParse(trimmed)
  if (direct) return direct

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch) {
    const parsed = safeJsonParse(fencedMatch[1].trim())
    if (parsed) return parsed
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    const parsed = safeJsonParse(objectMatch[0])
    if (parsed) return parsed
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    const parsed = safeJsonParse(arrayMatch[0])
    if (parsed) return parsed
  }

  throw new Error(`Unable to parse JSON from model response: ${trimmed.slice(0, 500)}`)
}

export async function githubRequest(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RepoFuse',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`GitHub request failed (${response.status}): ${message}`)
  }

  return response.json()
}

async function getGitHubRepository(fullName, accessToken) {
  return githubRequest(`https://api.github.com/repos/${fullName}`, accessToken)
}

async function getGitHubRepositoryTree(fullName, branch, accessToken) {
  return githubRequest(`https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`, accessToken)
}

function selectInterestingFiles(tree, maxFilesPerRepo) {
  return tree
    .filter((item) => item.type === 'blob' && isCodeFile(item.path))
    .map((item) => ({
      ...item,
      extension: pathExtension(item.path),
      score: scoreFilePath(item.path),
    }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, maxFilesPerRepo)
}

function isCodeFile(path) {
  const extension = pathExtension(path)
  if (!extension) return false
  if (!CODE_EXTENSIONS.has(extension)) return false

  const lowered = path.toLowerCase()
  return !(
    lowered.includes('/node_modules/') ||
    lowered.includes('/dist/') ||
    lowered.includes('/build/') ||
    lowered.includes('/coverage/') ||
    lowered.includes('/.next/') ||
    lowered.includes('/vendor/') ||
    lowered.endsWith('.min.js')
  )
}

function scoreFilePath(path) {
  const lowered = path.toLowerCase()
  let score = 0

  if (lowered.includes('/app/')) score += 10
  if (lowered.includes('/src/')) score += 8
  if (lowered.includes('/components/')) score += 12
  if (lowered.includes('/hooks/')) score += 11
  if (lowered.includes('/lib/')) score += 10
  if (lowered.includes('/api/')) score += 11
  if (lowered.includes('/services/')) score += 9
  if (lowered.includes('/utils/')) score += 9
  if (lowered.includes('/pages/')) score += 7
  if (lowered.endsWith('package.json')) score -= 5
  if (lowered.includes('.test.') || lowered.includes('.spec.')) score -= 4
  if (lowered.includes('config')) score -= 2

  return score
}

function classifyFileType(path) {
  const lowered = path.toLowerCase()
  const name = lowered.split('/').pop() || lowered

  if (lowered.includes('/components/') || name.includes('component')) return 'component'
  if (lowered.includes('/hooks/') || name.startsWith('use')) return 'hook'
  if (lowered.includes('/api/') || name.includes('api')) return 'api'
  if (lowered.includes('/lib/') || lowered.includes('/utils/') || name.includes('util')) return 'utility'
  if (lowered.includes('/pages/') || lowered.includes('/app/') || name.includes('page')) return 'page'
  if (name.includes('layout')) return 'layout'
  if (name.includes('schema')) return 'schema'
  if (name.includes('config')) return 'config'
  return 'source'
}

function buildBlueprintPrompt({ repositories, files, maxBlueprints }) {
  const repoSummary = repositories
    .map((repo) => {
      const fullName = repo.full_name || repo.repo || repo.platform || 'unknown-source'
      const language = repo.language || 'unknown language'
      const branch = repo.default_branch || 'unknown-branch'
      const count = repo.scanned_file_count || repo.file_count || 0
      return `- ${fullName} (${language}, default branch: ${branch}, scanned files: ${count})`
    })
    .join('\n')

  const fileSummary = files
    .map((file) => {
      const details = [file.file_type]
      if (file.extension) details.push(`.${file.extension}`)
      if (file.purpose) details.push(`purpose: ${file.purpose}`)
      return `- ${file.repo}: ${file.path} [${details.filter(Boolean).join(', ')}]`
    })
    .join('\n')

  return `You are RepoFuse, an expert software architect that finds buildable products hidden inside existing repositories.\n\nRepositories:\n${repoSummary}\n\nFiles scanned:\n${fileSummary}\n\nReturn ONLY valid JSON with this shape:\n{\n  "blueprints": [\n    {\n      "name": "string",\n      "description": "string",\n      "appType": "string",\n      "complexity": "simple|moderate|complex",\n      "reusePercentage": 0,\n      "existingFiles": [{ "path": "string", "purpose": "string" }],\n      "missingFiles": [{ "name": "string", "purpose": "string" }],\n      "technologies": ["string"],\n      "estimatedEffort": "string",\n      "explanation": "string"\n    }\n  ]\n}\n\nRules:\n- Generate between 2 and ${maxBlueprints} blueprints.\n- Be concrete and practical.\n- Reuse percentages must reflect how much of the app appears already present.\n- Missing files should stay lean; prefer the smallest viable build.\n- Only cite files from the provided list.`
}

function summarizeScannedFiles(scannedFiles) {
  const byRepo = new Map()

  for (const file of scannedFiles) {
    const key = file.repo || file.repository || file.platform || 'unknown-source'
    const current = byRepo.get(key) || {
      full_name: key,
      default_branch: 'n/a',
      language: file.language || null,
      scanned_file_count: 0,
    }

    current.scanned_file_count += 1
    if (!current.language && file.language) current.language = file.language
    byRepo.set(key, current)
  }

  return [...byRepo.values()]
}

function normalizeExistingFiles(files) {
  return (Array.isArray(files) ? files : []).map((file) => {
    if (typeof file === 'string') {
      return { path: file, purpose: 'Reusable source file' }
    }

    return {
      path: file.path || file.name || 'unknown-file',
      purpose: file.purpose || file.description || 'Reusable source file',
    }
  })
}

function normalizeMissingFiles(files) {
  return normalizeMissingFileNames(files).map((name) => ({
    name,
    purpose: 'Implementation needed',
  }))
}

function normalizeMissingFileNames(files) {
  return (Array.isArray(files) ? files : []).map((file) => {
    if (typeof file === 'string') return file
    return file.name || file.path || 'missing-file'
  })
}

function normalizeComplexity(value) {
  if (value === 'simple' || value === 'moderate' || value === 'complex') return value
  return 'moderate'
}

function clampPercentage(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function pathExtension(path) {
  return path.split('.').pop()?.toLowerCase() || ''
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function getAnthropicText(response) {
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('Anthropic did not return text content.')
  }

  return text
}

async function createFileInRepo({ owner, repo, path, content, accessToken }) {
  const encodedContent = Buffer.from(content).toString('base64')
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: `Add ${path}`,
      content: encodedContent,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create ${path}: ${errorText}`)
  }
}

async function readGitHubError(response) {
  try {
    const payload = await response.json()
    return payload.message || 'GitHub request failed'
  } catch {
    return response.text()
  }
}

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'repofuse-app'
}

function toEnvValue(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .toUpperCase()
}
